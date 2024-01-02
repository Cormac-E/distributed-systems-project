const Eureka = require('eureka-js-client').Eureka;
const express = require('express');
const app = express();
const port = 6001;

app.use(express.json());

const providerName = 'Allied Irish Bank';
const linkToImage = "https://pbs.twimg.com/profile_images/1277622308715343872/TcUC4R0S_400x400.jpg";

const eurekaClient = new Eureka({
  instance: { 
    app: 'HOME-LOAN-SERVICES', // Use a common Eureka app ID for all related services
    instanceId: 'home-loan-aib', // Unique instance ID for this service
    hostName: 'home-loan-aib',
    ipAddr: 'home-loan-aib', // Adjust as needed for Docker networking
    statusPageUrl: `http://home-loan-aib:${port}/info`,
    healthCheckUrl: `http://home-loan-aib:${port}/health`,
    port: {
      '$': port,
      '@enabled': true,
    },
    vipAddress: 'home-loan-aib',
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


eurekaClient.start(error => {
  if (error) {
    console.log('Eureka registration failed:', error);
  } else {
    console.log('Eureka registration complete');
  }
});

eurekaClient.on('/info', () => {
  console.log('Eureka client registered');
});

app.post('/calculate-loan', (req, res) => {

    // Parse the JSON request body
    const { loanAmount, creditScore, loanTermLength } = req.body;
    
    if (!loanAmount || !creditScore) {
        return res.status(400).send('Invalid request');
    }

    // Calculate the interest rate
    let interestRate = 0;
    
    if (creditScore < 600) {
        interestRate = 0.1;
    } else if (creditScore < 700) {
        interestRate = 0.08;
    } else {
        interestRate = 0.05;
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

app.listen(port, async () => {
    console.log(`AIB home loan service listening at http://home-loan-aib:${port}`);
});