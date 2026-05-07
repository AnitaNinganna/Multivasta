import { toast } from 'react-toastify';

export const useNotification = () => {
  const success = (message, options = {}) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  };

  const error = (message, options = {}) => {
    toast.error(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  };

  const info = (message, options = {}) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  };

  const warning = (message, options = {}) => {
    toast.warning(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  };

  const loading = (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      ...options,
    });
  };

  const update = (toastId, options) => {
    toast.update(toastId, options);
  };

  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    update,
    dismiss,
  };
};
