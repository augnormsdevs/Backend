def updateGitHubStatus(String state, String description) {
  // Validate and normalize state
 def validState = ['success', 'failure', 'pending', 'error'].contains(state.toLowerCase()) ? 
        state.toLowerCase() : 'error'  

  withCredentials([usernamePassword(credentialsId: 'cec555a4-7bcd-48e3-b491-3cdcff3d3ff1', usernameVariable: 'GITHUB_USER', passwordVariable: 'GITHUB_TOKEN')]) {
    withEnv(["TOKEN=$GITHUB_TOKEN", "USER=$GITHUB_USER"]) {
      sh """#!/bin/bash
        curl -sS -X POST \\
            -u "$USER:$TOKEN" \\
            -H "Accept: application/vnd.github.v3+json" \\
            "https://api.github.com/repos/augnormsdevs/Backend/statuses/${GIT_COMMIT}" \\
            -d '{
            "state": "${validState}",
            "target_url": "${BUILD_URL}",
            "description": "${description}",
            "context": "${STATUS_CONTEXT}"
            }'
        """
    }
  }
}

pipeline {
    agent any

    environment {
        DB_HOST = credentials('DATABASE_HOST')
        DB_PORT = credentials('DATABASE_PORT')
        DB_NAME = credentials('DATABASE_NAME')
        DB_USER = credentials('DATABASE_USER')
        DB_PASSWORD = credentials('MYSQL_DB_PASSWORD')
        ACCESS_LEVEL_ENDPOINT = credentials("ACCESS_LEVEL_ENDPOINT")
        PROFILE_IMAGE_ENDPOINT = credentials("PROFILE_IMAGE_ENDPOINT")
        ALLPROFILE_IMAGES_ENDPOINT = credentials("ALLPROFILE_IMAGES_ENDPOINT")
    }

    stages {

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Validate package.json') {
            environment {
                STATUS_CONTEXT = 'jenkins/package-validation'
            }
            steps {
                configFileProvider([configFile(fileId: 'fe7d7862-f4d5-4b49-aa6a-0fd72c48292b', variable: 'backend_packages')]) {
                    sh '''
                        echo "Comparing current package.json to reference..."

                        # Extract dependencies only (or use jq for advanced comparison)
                        jq '.dependencies' package.json > current_deps.json
                        jq '.dependencies' -- "$backend_packages" > reference_deps.json

                        echo "File content from backend_packages:"
                        cat "$backend_packages"



                        # Diff and store result
                        diff_output=$(diff -u reference_deps.json current_deps.json || true)

                        if [ -n "$diff_output" ]; then
                            echo "Dependency differences found:"
                            echo "$diff_output"
                            echo "$diff_output" > diff_result.txt
                            exit 1  # Fail the step
                        else
                            echo "No differences found in dependencies."
                        fi
                    '''
                }
            }
            post {
                success {
                    updateGitHubStatus('success', 'Validation passed')
                }
                unstable {
                    updateGitHubStatus('failure', 'Validation differences found')
                }
                failure {
                    updateGitHubStatus('error', 'Validation failed')
                }
            }
        } 

        stage('Install Dependencies') {
              environment {
                STATUS_CONTEXT = 'jenkins/dependency-install' 
            }

            steps {
                script {
                    sh 'npm install'
                }
            }
            post {
                success { updateGitHubStatus('success', 'Dependencies installed') }
                failure { updateGitHubStatus('error', 'Installation failed') }
            }
        }

        stage('Run Build') {
            environment {
                STATUS_CONTEXT = 'jenkins/build'
            }
            steps {
                script {
                    sh 'npm run build' 
                }
            }
            post {
                success { updateGitHubStatus('success', 'Build completed') }
                failure { updateGitHubStatus('error', 'Build failed') }
            }
        }
        
        stage('Push to Docker Hub (simulating ECR)') {
            environment {
                STATUS_CONTEXT = 'jenkins/docker-push'
            }
            steps {
                script {
                    // Use your Docker Hub credential ID here
                   withCredentials([usernamePassword(credentialsId: 'dbfbbbf6-22d0-496b-a2ec-b943f6669e23', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker build -t augustine963/ekissi_backend:latest .
                        docker push augustine963/ekissi_backend:latest
                        '''
                   }

                }
            }
            post {
                success { updateGitHubStatus('success', 'Docker image pushed successfully') }
                failure { updateGitHubStatus('error', 'Docker image push failed') }
            }
        }

        stage('Prepare Deploy Script') {
            steps {
                writeFile file: 'deploy.sh', text: '''
                   #!/bin/bash

                    echo "🐘 Ensuring MySQL container is running..."

                    # Check if the MySQL container exists
                    if [ "$(docker ps -a -q -f name=mysql_database)" ]; then
                    # Check if it's stopped
                    if [ "$(docker inspect -f '{{.State.Running}}' mysql_database)" = "false" ]; then
                        echo "🔄 Starting existing MySQL container..."
                        docker start mysql_database
                    else
                        echo "✅ MySQL container is already running."
                    fi
                    else
                    echo "📦 Creating and starting new MySQL container..."
  
                        docker run -d --name mysql_database \
                         --network ekissi_network \
                         -e MYSQL_ROOT_PASSWORD="$DB_PASSWORD" \
                         -e MYSQL_DATABASE="$DB_NAME" \
                         -e MYSQL_USER="$DB_USER" \
                         -e MYSQL_DB_PASSWORD="$DB_PASSWORD" \
                         -v mysql_db:/var/lib/mysql \
                         -p 3307:3306 \
                         mysql:latest
                    fi

                    echo "⏳ Giving MySQL a few seconds to get ready..."
                    sleep 10

                    echo "🔄 Pulling latest image..."
                    docker pull augustine963/ekissi_backend:latest

                    echo "🛑 Stopping existing container if running..."
                    docker stop ekissi_backend || true
                    docker rm ekissi_backend || true

                    echo "🚀 Starting new container..."
                    docker run -d --name ekissi_backend \
                    --network ekissi_network \
                    -p 3000:3000 \
                    -e DATABASE_HOST="$DB_HOST" \
                    -e DATABASE_PORT="$DB_PORT" \
                    -e DATABASE_NAME="$DB_NAME" \
                    -e DATABASE_USER="$DB_USER" \
                    -e DATABASE_PASSWORD="$DB_PASSWORD" \
                    -e ACCESS_LEVEL_ENDPOINT="$ACESS_LEVEL_ENDPOINT" \
                    -e PROFILE_IMAGE_ENDPOINT="$PROFILE_IMAGE_ENDPOINT" \
                    -e ALLPROFILE_IMAGES_ENDPOINT="$ALLPROFILE_IMAGES_ENDPOINT" \
                    augustine963/ekissi_backend:latest

                    echo "✅ Deployment complete. App should be running on http://localhost:3000"

                '''
                sh 'chmod +x deploy.sh'
            }
        }

        stage('Deploy Container') {
            steps {
                sh './deploy.sh'
            }
        }

    }

}