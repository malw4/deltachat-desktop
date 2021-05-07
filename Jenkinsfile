pipeline {

    agent {
docker { image 'node:latest' } 
    }
    stages{

        stage('Build'){

            steps{
                echo 'Building..'
		        checkout scm
		        sh 'apt install npm -y'
		        sh 'npm run build'
                }
            }
        
        
        stage('Test') {
            when {
              	expression {currentBuild.result == null || currentBuild.result == 'SUCCESS'}
            }
            steps{
                echo 'Start testing'
                sh 'apt install npm -y'
                sh 'apt install nodejs'
                sh 'npm install -g typescript'
                sh 'npm test'
            }
        }
    }

    
    post {

        success {
            emailext attachLog: true, 
                body: "Test status: ${currentBuild.currentResult}: Job ${env.JOB_NAME}, More informations in attachment", 
                recipientProviders: [developers()], 
                subject: 'Test passed', 
                to: 'accociesla@gmail.com'
        }

        failure {
            emailext attachLog: true, 
                body: "Test status: ${currentBuild.currentResult}: Job ${env.JOB_NAME}, More informations in attachment", 
                recipientProviders: [developers()], 
                subject: 'Test failed', 
                to: 'accociesla@gmail.com'
        }
    }
}
