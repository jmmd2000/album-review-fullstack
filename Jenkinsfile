pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        // Pull down the Jenkinsfile and code from SCM
        checkout scm
      }
    }

    stage('Stop Containers') {
      steps {
        sshagent(credentials: ['vps-ssh']) {
          sh '''
ssh -o StrictHostKeyChecking=no ${env.VPS_HOST} << 'ENDSSH'
set -e
cd ${env.APP_DIR}
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
ssh -o StrictHostKeyChecking=no ${env.VPS_HOST} << 'ENDSSH'
cd ${env.APP_DIR}
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
ssh -o StrictHostKeyChecking=no ${env.VPS_HOST} << 'ENDSSH'
cd ${env.APP_DIR}
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
