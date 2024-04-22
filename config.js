const LOCAL_API_KEY = 'AIzaSyColZhkny9WIgMwoSsM6d92XkF3JM0ANtc';
const DEPLOYED_API_KEY = '';

const Config = {
    apiKey: window.location.hostname === 'localhost' ? LOCAL_API_KEY : DEPLOYED_API_KEY
};

export default Config;