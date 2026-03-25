pipeline {
  agent any

  parameters {
    choice(name: 'DEPLOY_ENV', choices: ['staging', 'production'], description: 'Where to deploy?')
    choice(name: 'ACTION', choices: ['Build and Deploy', 'Deploy Only'], description: 'Full rebuild and deploy? Or just deploy existing images? (i.e. deploying to production once checked on staging)')
    booleanParam(name: 'CONFIRM_TESTED', defaultValue: false, description: 'I have definitely run tests locally!!')
    booleanParam(name: 'TAKE_BACKUP', defaultValue: true, description: 'Backup before deploying (prod only)')
    booleanParam(name: 'RUN_MIGRATIONS', defaultValue: false, description: 'Run DB migrations?')
    string(name: 'OVERRIDE_TAG', defaultValue: '', description: 'Manually specify a tag (empty = current commit hash)')
  }

  environment {
    VPS_HOST = "159.195.47.245"
    VPS_USER = "james"
    GITHUB_USER = "jmmd2000"
    IMAGE_TAG = "${params.OVERRIDE_TAG ?: sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()}"
    APP_NAME = "album-reviews"
  }

  stages {
    stage('Safety Check') {
      when { expression { params.ACTION == 'Build and Deploy' } }
      steps {
        script {
          if (!params.CONFIRM_TESTED) {
            error "GO BACK AND TEST FIRST!"
          }
          echo "I definitely tested..."
        }
      }
    }

    stage('Build & Push Images') {
      when { expression { params.ACTION == 'Build and Deploy' } }
      steps {
        script {
          withCredentials([usernamePassword(credentialsId: 'github-ghcr', usernameVariable: 'GH_USER', passwordVariable: 'GH_PAT')]) {
            sh "echo ${GH_PAT} | docker login ghcr.io -u ${GH_USER} --password-stdin"
            
            parallel failFast: true,
              "Backend Build": {
                sh "docker build -f backend/Dockerfile -t ghcr.io/${GITHUB_USER}/album-backend:${IMAGE_TAG} ."
              },
              "Frontend Build": {
                sh "docker build -f frontend/Dockerfile -t ghcr.io/${GITHUB_USER}/album-frontend:${IMAGE_TAG} ."
              }

            parallel(
              "Backend Push": {
                sh "docker push ghcr.io/${GITHUB_USER}/album-backend:${IMAGE_TAG}"
              },
              "Frontend Push": {
                sh "docker push ghcr.io/${GITHUB_USER}/album-frontend:${IMAGE_TAG}"
              }
            )
          }
        }
      }
    }

    stage('Deploy to VPS') {
      steps {
        script {
          def targetDir = params.DEPLOY_ENV == 'production' ? "/home/james/album-review/prod" : "/home/james/album-review/staging"
          def envCredId = params.DEPLOY_ENV == 'production' ? "album-env-prod" : "album-env-staging"
          def domain = params.DEPLOY_ENV == 'production' ? "jamesreviewsmusic.com" : "staging.jamesreviewsmusic.com"
          def appNameEnv = "${APP_NAME}-${params.DEPLOY_ENV}"

          echo "🚚 Deploying version ${IMAGE_TAG} to ${params.DEPLOY_ENV}..."

          sshagent(['vps-ssh']) {
            // Clean the directory
            sh "ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} 'rm -rf ${targetDir} && mkdir -p ${targetDir}'"

            sh "scp docker-compose.yml ${VPS_USER}@${VPS_HOST}:${targetDir}/docker-compose.yml"
            sh "scp backup.sh ${VPS_USER}@${VPS_HOST}:${targetDir}/backup.sh"
            sh "ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} 'chmod +x ${targetDir}/backup.sh'"

            withCredentials([file(credentialsId: envCredId, variable: 'ENV_FILE')]) {
              sh "scp ${ENV_FILE} ${VPS_USER}@${VPS_HOST}:${targetDir}/.env"
            }

            // Jenkins credential files are scp'd as read-only, make writable so we can append to it
            sh "ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} 'chmod 600 ${targetDir}/.env'"

            // Add dynamic variables to the .env file
            sh """
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << "ENDSSH"
cd ${targetDir}
echo "IMAGE_TAG=${IMAGE_TAG}" >> .env
echo "GITHUB_USER=${GITHUB_USER}" >> .env
echo "APP_NAME=${appNameEnv}" >> .env
echo "DOMAIN=${domain}" >> .env
ENDSSH
"""

            if (params.TAKE_BACKUP && params.DEPLOY_ENV == 'production') {
              echo "Taking backup of prod before deploying..."
              sh "ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} 'cd ${targetDir} && ./backup.sh || echo \"Backup failed but proceeding...\"'"
            }

            // Command VPS to pull and restart
            sh """
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << "ENDSSH"
cd ${targetDir}
docker compose pull
docker compose up -d --remove-orphans
ENDSSH
"""

            if (params.DEPLOY_ENV == 'staging') {
              echo "Restoring latest prod backup into staging DB..."
              sh "ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} 'cd /home/james/album-review/staging && source <(grep -E \"^POSTGRES_(USER|DB)=\" .env) && LATEST=\$(ls -t /home/james/backups/album-reviews-production/backup-*.sql | head -n1) && docker exec -i album-reviews-staging-db-1 psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;\"'"
              sh "ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} 'cd /home/james/album-review/staging && source <(grep -E \"^POSTGRES_(USER|DB)=\" .env) && LATEST=\$(ls -t /home/james/backups/album-reviews-production/backup-*.sql | head -n1) && cat \$LATEST | docker exec -i album-reviews-staging-db-1 psql -U \$POSTGRES_USER -d \$POSTGRES_DB'"
            }

          }
        }
      }
    }

    stage('DB Migrations') {
      when { expression { params.RUN_MIGRATIONS == true } }
      steps {
        script {
          def targetDir = params.DEPLOY_ENV == 'production' ? "/home/james/album-review/prod" : "/home/james/album-review/staging"
          echo "Running migrations..."
          sshagent(['vps-ssh']) {
            sh """
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd ${targetDir}
docker compose exec -T backend ./node_modules/.bin/drizzle-kit push --config /app/dist/backend/drizzle.config.js
ENDSSH
"""
          }
        }
      }
    }
  }

  post {
    success {
      echo "Successfully deployed ${IMAGE_TAG} to ${params.DEPLOY_ENV}!"
    }
    failure {
      echo "Deployment failed - see console output."
    }
  }
}
