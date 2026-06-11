const axios = require('axios');

class ApiManager {
    constructor(config) {
        this.axiosInstance = axios.create({
            baseURL: config.baseURL,
            headers: config.headers
        });

        // Set up response and request interceptors if needed
        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request interceptor for API calls
        this.axiosInstance.interceptors.request.use(request => {
            // You can modify the request here, like adding authorization tokens
            return request;
        });

        // Response interceptor
        this.axiosInstance.interceptors.response.use(response => {
            // Handle successful responses
            return response;
        }, error => {
            // Handle response errors
            console.error('API Error:', error);
            return Promise.reject(error);
        });
    }

    async get(url, params = {}) {
        try {
            const response = await this.axiosInstance.get(url, { params });
            return response.data;
        } catch (error) {
            // Handle or throw the error as needed
            throw error;
        }
    }

    async post(url, data = {}) {
        try {
            const response = await this.axiosInstance.post(url, data);
            return response.data;
        } catch (error) {
            // Handle or throw the error as needed
            throw error;
        }
    }

    // Additional methods for PUT, DELETE, etc., can be added here
}

module.exports = ApiManager;
