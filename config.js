const LOCAL_API_KEY = '';
const DEPLOYED_API_KEY = 'AIzaSyBCM2ItkeZw0o6oOCvpQ5neK2O4eAW1Btk';

const Config = {
    apiKey: window.location.hostname === 'localhost' ? LOCAL_API_KEY : DEPLOYED_API_KEY
};

export default Config;