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

    }

}