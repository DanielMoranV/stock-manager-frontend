// src/utils/validationUtils.js

export function validateDNI(dni) {
    return /^\d{8}$/.test(dni);
}

export function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

export function validatePhone(phone) {
    return /^\d{9}$/.test(phone);
}

export function capitalizeName(name) {
    return name.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function restrictToNumbers(event) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
        event.preventDefault();
    }
}
