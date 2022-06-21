pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                bat 'npm install'
            }
        }
        stage('Unit Test') {
            steps {
                bat 'npm run unit_test'
            }
        }
        /*
        // integration test cannot run on Jenkins ?? keep waiting 
        stage('Integration Test') {
            steps {
                bat 'npm run integration_test'
            }
        }
        */
        stage('Deploy') {
            steps {
                echo 'deploying...'
            }
        }
    }
}