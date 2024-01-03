/// PTSB Home Loan Provider Service
/// Responsible for recieving a client request from the Home Loan Registry
/// and calculating a loan offer. This loan offer is returned to the Registry via HTTP

const Eureka = require('eureka-js-client').Eureka;
const express = require('express');
const app = express();
const port = 6002;

app.use(express.json());

const providerName = 'PermanentTSB';
const linkToImage = "https://pbs.twimg.com/profile_images/1713180948592791552/sfRNRTHO_400x400.jpg";

/**
 * Configure and Instantiate a PTSB home loan Eureka Client
 */
const eurekaClient = new Eureka({
  instance: { 
    app: 'HOME-LOAN-SERVICES', // Use a common Eureka app ID for all related services
    instanceId: 'home-loan-ptsb', // Unique instance ID for this service
    hostName: 'home-loan-ptsb',
    ipAddr: 'home-loan-ptsb', // Adjust as needed for Docker networking
    statusPageUrl: `http://home-loan-ptsb:${port}/info`,
    healthCheckUrl: `http://home-loan-ptsb:${port}/health`,
    port: {
      '$': port,
      '@enabled': true,
    },
    vipAddress: 'home-loan-ptsb',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    }
  },
  eureka: {
    host: 'eureka-server',
    port: 8761,
    servicePath: '/eureka/apps/'
  }
});

// Register with the home loan service discovery server
eurekaClient.start(error => {
  if (error) {
    console.log('Eureka registration failed:', error);
  } else {
    console.log('Eureka registration complete');
  }
});

// Notify of successful registration
eurekaClient.on('/info', () => {
  console.log('Eureka client registered');
});


/**
 * Route for calculating loan offers
 * Takes a client information object as a request
 * Retuns a loan ofer response
 * 
 * The loan offer is calculated by combing the requested loan details with
 * Client details like credit score.
 */
app.post('/calculate-loan', (req, res) => {

    // Parse the JSON request body
    const { loanAmount, creditScore, loanTermLength } = req.body;
    
    if (!loanAmount || !creditScore) {
        return res.status(400).send('Invalid request');
    }

    // Calculate the interest rate
    let interestRate = 0;
    
    if (creditScore < 600) {
        interestRate = 0.051;
    } else if (creditScore < 700) {
        interestRate = 0.049;
    } else {
        interestRate = 0.041;
    }

    // Calculate the monthly payment
    const monthlyPayment = (loanAmount * (interestRate + 1)) / loanTermLength;
    const totalPayment = monthlyPayment * loanTermLength;

    console.log('Interest rate:', interestRate);
    console.log('Interest rate:', monthlyPayment);

    // Prepare the response body
    const responseBody = {
        providerName,
        linkToImage,
        totalPayment,
        monthlyPayment,
        interestRate
    };

    // Send the response
    res.json(responseBody);

    // Log the request
    console.log('Received request to calculate loan');
    console.log('Request body:', req.body);
    console.log('Response body:', responseBody);
    
});

/// Start the PTSB home loan service.
app.listen(port, async () => {
    console.log(`PTSB home loan service listening at http://home-loan-ptsb:${port}`);
});