pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                npm install
            }
        }
        stage('Unit Test') {
            steps {
                bat npm run unit_test
            }
        }
        stage('Integration Test') {
            steps {
                bat npm run integration_test
            }
        }
        stage('Deploy') {
            steps {
                
            }
        }
    }
}