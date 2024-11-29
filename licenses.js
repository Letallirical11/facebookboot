// Clave de encriptación (cámbiala por una segura)
const ENCRYPTION_KEY = 'tu_clave_secreta_aqui';

// Funciones de utilidad
function generateLicenseKey() {
    return CryptoJS.lib.WordArray.random(16).toString();
}

function encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Manejo de licencias
let licenses = JSON.parse(localStorage.getItem('licenses') || '{}');

function saveLicenses() {
    localStorage.setItem('licenses', JSON.stringify(licenses));
    displayLicenses();
}

function generateLicense(clientName, duration) {
    const licenseKey = generateLicenseKey();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(duration));

    const licenseData = {
        client_name: clientName,
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'active'
    };

    licenses[licenseKey] = licenseData;
    saveLicenses();
    return licenseKey;
}

function revokeLicense(licenseKey) {
    if (licenses[licenseKey]) {
        licenses[licenseKey].status = 'revoked';
        saveLicenses();
        return true;
    }
    return false;
}

function validateLicense(licenseKey, machineId) {
    const license = licenses[licenseKey];
    if (!license) {
        return { valid: false, error: 'Licencia no encontrada' };
    }

    if (license.status !== 'active') {
        return { valid: false, error: 'Licencia revocada' };
    }

    const expiryDate = new Date(license.expiry_date);
    if (expiryDate < new Date()) {
        return { valid: false, error: 'Licencia expirada' };
    }

    return { 
        valid: true, 
        expiry_date: license.expiry_date 
    };
}

// UI Functions
function displayLicenses() {
    const licensesList = document.getElementById('licensesList');
    licensesList.innerHTML = '';

    Object.entries(licenses).forEach(([key, license]) => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-3 border rounded';
        div.innerHTML = `
            <strong>Licencia:</strong> ${key}<br>
            <strong>Cliente:</strong> ${license.client_name}<br>
            <strong>Expira:</strong> ${license.expiry_date}<br>
            <strong>Estado:</strong> ${license.status}<br>
            ${license.status === 'active' ? 
                `<button onclick="handleRevoke('${key}')" class="btn btn-danger btn-sm mt-2">Revocar</button>` : 
                '<span class="badge bg-secondary">Revocada</span>'}
        `;
        licensesList.appendChild(div);
    });
}

// Event Handlers
document.getElementById('licenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const clientName = document.getElementById('clientName').value;
    const duration = document.getElementById('duration').value;
    
    const licenseKey = generateLicense(clientName, duration);
    alert(`Licencia generada: ${licenseKey}`);
    
    document.getElementById('clientName').value = '';
    document.getElementById('duration').value = '30';
});

function handleRevoke(licenseKey) {
    if (confirm('¿Estás seguro de que deseas revocar esta licencia?')) {
        if (revokeLicense(licenseKey)) {
            alert('Licencia revocada exitosamente');
        } else {
            alert('Error al revocar la licencia');
        }
    }
}

// Inicializar la interfaz
displayLicenses();
