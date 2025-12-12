document.addEventListener('DOMContentLoaded', function () {
    const deliveryModeSelect = document.getElementById('deliveryMode');
    const deliverWithContainer = document.getElementById('deliverWithContainer');
    const deliverWithSelect = document.getElementById('deliverWithId');

    if (!deliveryModeSelect || !deliverWithContainer || !deliverWithSelect) {
        return; // Exit if elements don't exist
    }

    // Function to toggle the "Deliver With" field
    function toggleDeliverWith() {
        const selectedMode = deliveryModeSelect.value;
        
        if (selectedMode === 'WITH_OTHER') {
            deliverWithContainer.style.display = 'block';
            deliverWithSelect.setAttribute('required', 'required');
        } else {
            deliverWithContainer.style.display = 'none';
            deliverWithSelect.removeAttribute('required');
            // Clear the selection when hiding
            $(deliverWithSelect).val('').trigger('change');
        }
    }

    // Initialize on page load
    toggleDeliverWith();

    // Listen for changes on delivery mode
    deliveryModeSelect.addEventListener('change', toggleDeliverWith);
    
    // Also handle Select2 change event if Select2 is initialized on this field
    $(deliveryModeSelect).on('change', toggleDeliverWith);
});
