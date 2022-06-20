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
                npm run unit_test
            }
        }
        stage('Integration Test') {
            steps {
                npm run integration_test
            }
        }
        stage('Deploy') {
            steps {
                echo 'deploying...'
            }
        }
    }
}