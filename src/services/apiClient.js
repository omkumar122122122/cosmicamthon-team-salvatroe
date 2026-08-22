const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  getAuthToken() {
    return localStorage.getItem('child_safety_token') || sessionStorage.getItem('child_safety_token');
  }

  getRefreshToken() {
    return localStorage.getItem('child_safety_refresh_token') || sessionStorage.getItem('child_safety_refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      if (localStorage.getItem('child_safety_token')) {
        localStorage.setItem('child_safety_token', accessToken);
      }
      if (sessionStorage.getItem('child_safety_token')) {
        sessionStorage.setItem('child_safety_token', accessToken);
      }
      if (!localStorage.getItem('child_safety_token') && !sessionStorage.getItem('child_safety_token')) {
        localStorage.setItem('child_safety_token', accessToken);
      }
    }

    if (refreshToken) {
      if (localStorage.getItem('child_safety_refresh_token')) {
        localStorage.setItem('child_safety_refresh_token', refreshToken);
      }
      if (sessionStorage.getItem('child_safety_refresh_token')) {
        sessionStorage.setItem('child_safety_refresh_token', refreshToken);
      }
      if (!localStorage.getItem('child_safety_refresh_token') && !sessionStorage.getItem('child_safety_refresh_token')) {
        localStorage.setItem('child_safety_refresh_token', refreshToken);
      }
    }
  }

  clearTokens() {
    ['child_safety_token', 'child_safety_refresh_token', 'child_safety_user'].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const url = `${this.baseURL}/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Refresh-Token': refreshToken,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const msg = data?.message || 'Refresh token expired or invalid';
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }

    const resData = await response.json();
    const tokenData = resData && typeof resData === 'object' && 'data' in resData ? resData.data : resData;
    const newAccessToken = tokenData.accessToken || tokenData.tokens?.accessToken;
    const newRefreshToken = tokenData.refreshToken || tokenData.tokens?.refreshToken;

    if (!newAccessToken) {
      throw new Error('Failed to extract access token from refresh response');
    }

    this.setTokens(newAccessToken, newRefreshToken);
    window.dispatchEvent(
      new CustomEvent('auth:token-refreshed', {
        detail: { token: newAccessToken, refreshToken: newRefreshToken },
      })
    );

    return newAccessToken;
  }

  async request(endpoint, options = {}) {
    const token = this.getAuthToken();
    
    const config = {
      ...options,
      headers: {
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, config);

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register') || endpoint.includes('/auth/refresh');

        // Automatic token refresh & retry on 401 Unauthorized
        if (response.status === 401 && !isAuthEndpoint && !options._isRetry) {
          const refreshToken = this.getRefreshToken();

          if (refreshToken) {
            if (this.isRefreshing) {
              return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
              })
                .then((newToken) => {
                  return this.request(endpoint, {
                    ...options,
                    _isRetry: true,
                    headers: {
                      ...options.headers,
                      Authorization: `Bearer ${newToken}`,
                    },
                  });
                })
                .catch((err) => {
                  throw err;
                });
            }

            this.isRefreshing = true;

            try {
              const newAccessToken = await this.refreshToken();
              this.isRefreshing = false;
              this.processQueue(null, newAccessToken);

              return this.request(endpoint, {
                ...options,
                _isRetry: true,
                headers: {
                  ...options.headers,
                  Authorization: `Bearer ${newAccessToken}`,
                },
              });
            } catch (refreshErr) {
              this.isRefreshing = false;
              this.processQueue(refreshErr, null);
              this.clearTokens();
              window.dispatchEvent(new Event('auth:unauthorized'));
              throw refreshErr;
            }
          } else {
            this.clearTokens();
            window.dispatchEvent(new Event('auth:unauthorized'));
          }
        }

        // Format validation error messages from NestJS
        let errorMessage = '';
        if (response.status === 400 && data) {
          if (data.statusCode === 400) {
            console.error('API Validation Error:', data);
            if (Array.isArray(data.message)) {
              errorMessage = data.message.join('; ');
            } else if (typeof data.message === 'string') {
              errorMessage = data.message;
            } else {
              errorMessage = 'Validation error - check console for details';
            }
          } else {
            errorMessage = data.message || data.error || `Validation error: ${JSON.stringify(data)}`;
          }
        } else {
          errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        error.validation = data?.statusCode === 400 ? data : null;
        throw error;
      }

      return data;
    } catch (error) {
      if (!error.status && (!error.message || error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        error.message = 'Network error. Please check your connection to the server.';
      }
      throw error;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
