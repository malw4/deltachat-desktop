pipeline {
	agent any
	stages {
	   stage ('Build') {
		steps {
		  sh 'make'
		  echo 'Building'
		}
	   }
	   stage ('Test') {
		steps {
		  sh 'make check || true'
		  echo 'Testing;
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
