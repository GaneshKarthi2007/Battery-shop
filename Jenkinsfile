pipeline {
agent any

environment {
    COMPOSER_ALLOW_SUPERUSER = '1'
    PROJECT_PATH = '/var/www/battery/Battery-shop'
}

options {
    timestamps()
}

stages {

    stage('Pull Latest Code') {
        steps {

            dir("${PROJECT_PATH}") {

                sh '''
                    git checkout main 
                    
                    git fetch origin 
                    
                    git reset --hard origin/main
                    
                    git clean -fd
                '''
            }
        }
    }

    stage('Backend - Install Dependencies') {
        steps {

            dir("${PROJECT_PATH}/backend") {

                sh '''
                    composer install \
                    --no-interaction \
                    --prefer-dist \
                    --optimize-autoloader
                '''

                sh '''
                    chmod -R 775 storage bootstrap/cache
                '''

                sh 'php artisan config:clear'
                sh 'php artisan cache:clear'
                sh 'php artisan route:clear'
                sh 'php artisan view:clear'

                sh 'php artisan config:cache'
                sh 'php artisan route:cache'
                sh 'php artisan view:cache'
            }
        }
    }

    stage('Frontend - Build') {
        steps {

            dir("${PROJECT_PATH}/frontend") {

                sh '''
                    rm -rf node_modules

                    npm install

                    npm run build
                '''
            }
        }
    }

    stage('Run Laravel Migration') {
        steps {

            dir("${PROJECT_PATH}/backend") {

                sh 'php artisan migrate --force'
            }
        }
    }
}

post {

    always {
        echo 'Pipeline execution completed.'
    }

    success {
        echo 'Deployment completed successfully!'
    }

    failure {
        echo 'Pipeline failed.'
    }
}


}
