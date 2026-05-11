export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Basic Browser Detection
  if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Mozilla Firefox';
  } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
    browser = 'Opera';
  } else if (userAgent.indexOf('Trident') > -1) {
    browser = 'Microsoft Internet Explorer';
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Microsoft Edge';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Google Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'Apple Safari';
  }

  // Basic OS Detection
  if (userAgent.indexOf('Win') > -1) {
    os = 'Windows';
  } else if (userAgent.indexOf('Mac') > -1) {
    os = 'MacOS';
  } else if (userAgent.indexOf('X11') > -1) {
    os = 'UNIX';
  } else if (userAgent.indexOf('Linux') > -1) {
    os = 'Linux';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    os = 'iOS';
  }

  return `${browser} on ${os}`;
};

export const getIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown IP';
  } catch (error) {
    console.error('Failed to fetch IP address:', error);
    return 'Unknown IP';
  }
};
