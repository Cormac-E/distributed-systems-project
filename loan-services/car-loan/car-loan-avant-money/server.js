/// Avant Money Car Loan Provider Service
/// Responsible for recieving a client request from the Car Loan Registry
/// and calculating a loan offer. This loan offer is returned to the Registry via HTTP

const Eureka = require('eureka-js-client').Eureka;
const express = require('express');
const app = express();
const port = 6002;

app.use(express.json());

const providerName = 'Avant Money';
const linkToImage = "https://pbs.twimg.com/profile_images/1374701476581412868/bydIeIxt_400x400.jpg";

/**
 * Configure and Instantiate an Avant Money car loan Eureka Client
 */
const eurekaClient = new Eureka({
  instance: { 
    app: 'CAR-LOAN-SERVICES', // Use a common Eureka app ID for all related services
    instanceId: 'car-loan-avant-money', // Unique instance ID for this service
    hostName: 'car-loan-avant-money',
    ipAddr: 'car-loan-avant-money', // Adjust as needed for Docker networking
    statusPageUrl: `http://car-loan-avant-money:${port}/info`,
    healthCheckUrl: `http://car-loan-avant-money:${port}/health`,
    port: {
      '$': port,
      '@enabled': true,
    },
    vipAddress: 'car-loan-avant-money',
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

// Register with the car loan service discovery server
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
        interestRate = 0.10;
    } else if (creditScore < 700) {
        interestRate = 0.095;
    } else {
        interestRate = 0.08;
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

/// Start the Avant Money car loan service.
app.listen(port, async () => {
    console.log(`Avant Money car loan service listening at http://car-loan-avant-money:${port}`);
});