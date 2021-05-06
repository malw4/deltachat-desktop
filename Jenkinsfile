pipeline {
	agent any
	stages {
	   stage ('Build') {
		steps {
		  checkout scm
		  sh 'npm install'
		  sh 'npm run build'
		  echo 'Building'
		}
	   }
	   stage ('Test') {
	    when {
               expression {
                currentBuild.result == null || currentBuild.result == 'SUCCESS' 
               }
            }
		steps {
		  echo 'Testing'
		  sh 'npm test'
		}
	   }
	   stage ('Deploy') {
		steps {
		  echo 'Deploying'
		}
	   }
	}
	
    post {

        success {
            emailext attachLog: true, 
                body: "Test status: ${currentBuild.currentResult}", 
                subject: 'Test passed', 
                to: 'accociesla@gmail.com'
        }

        failure {
            emailext attachLog: true, 
                body: "Test status: ${currentBuild.currentResult}",
                subject: 'Test failed', 
                to: 'accociesla@gmail.com'
        }
    }
}
