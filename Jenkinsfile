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

    stage('Run DB Migrations') {
      steps {
        withCredentials([string(credentialsId: 'db-url', variable: 'DB_URL')]) {
          sshagent(credentials: ['vps-ssh']) {
            sh '''
ssh -o StrictHostKeyChecking=no $VPS_HOST << ENDSSH
cd $APP_DIR
echo 'Running DB migrations'
docker exec -i album-review-fullstack-db-1 psql "$DB_URL" < backend/migrations/20260116_multi_artist.sql
docker exec -i album-review-fullstack-db-1 psql "$DB_URL" < backend/migrations/20260116_backfill_featured_track_artists.sql
ENDSSH
'''
          }
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
