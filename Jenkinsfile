pipeline {
    agent any
    stages {
        stage('Build') {
            when {
                branch 'master'
            }
            steps {
                sh "docker build --tag ${GIT_COMMIT} ."
            }
        }
        stage('Publish') {
            when {
                branch 'master'
            }
            steps {
                sh "docker tag ${GIT_COMMIT} fintlabsacr.azurecr.io/information-model-documentation-portal:build.${BUILD_NUMBER}"
                withDockerRegistry([credentialsId: 'fintlabsacr.azurecr.io', url: 'https://fintlabsacr.azurecr.io']) {
                    sh "docker push fintlabsacr.azurecr.io/information-model-documentation-portal:build.${BUILD_NUMBER}"
                }
            }
        }
    }
}
