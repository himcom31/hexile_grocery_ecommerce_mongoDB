// Fire this from anywhere to open the login modal
export const openLoginModal = () => {
  window.dispatchEvent(new CustomEvent("open-login-modal"));
};