$(function () {
    $('#MessageBox .text-option').on('change', function () {
        $('#MessageBox .form-item.text').show();
        $('#MessageBox .form-item.file').hide();
    });

    $('#MessageBox .file-option').on('change', function () {
        $('#MessageBox .form-item.text').hide();
        $('#MessageBox .form-item.file').show();
    });
});
