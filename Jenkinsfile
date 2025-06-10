pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        // Pull down the Jenkinsfile and code from SCM
        checkout scm
      }
    }

    stage('Run Tests') {
      // Use Docker agent for Node tests
      agent {
        docker {
          image 'node:18'
          args '--user root'
        }
      }
      steps {
        dir('backend') {
          // Install dependencies and run Jest, capturing exit code
          sh 'npm ci'
          script {
            def status = sh(script: 'npx jest --runInBand | tee ../test-results.txt', returnStatus: true)
            archiveArtifacts artifacts: 'test-results.txt', allowEmptyArchive: true
            if (status != 0) {
              error 'Tests failed'
            }
          }
        }
      }
    }

    stage('Stop Containers') {
      steps {
        sshagent(credentials: ['vps-ssh']) {
          sh '''
ssh -o StrictHostKeyChecking=no $VPS_HOST << ENDSSH
  set -e
  cd $APP_DIR
  echo '⏬ Stopping containers'
  docker-compose down || echo 'No containers to stop'
ENDSSH
'''
        }
      }
    }

    stage('Pull Latest Code') {
      steps {
        sshagent(credentials: ['vps-ssh']) {
          sh '''
ssh -o StrictHostKeyChecking=no $VPS_HOST << ENDSSH
  cd $APP_DIR
  echo '⬇️ Pulling latest code'
  git pull --ff-only
ENDSSH
'''
        }
      }
    }

    stage('Rebuild & Start Containers') {
      steps {
        sshagent(credentials: ['vps-ssh']) {
          sh '''
ssh -o StrictHostKeyChecking=no $VPS_HOST << ENDSSH
  cd $APP_DIR
  echo '🔄 Rebuilding and starting containers'
  docker-compose -f docker-compose.yml up --build -d
ENDSSH
'''
        }
      }
    }
  }

  post {
    failure {
      echo '⚠️ Deployment failed - see console output for errors'
    }
  }
}
