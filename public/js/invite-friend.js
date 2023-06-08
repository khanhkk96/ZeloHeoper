$(function () {
    $('#Friends .text-option').on('change', function () {
        // const checkValue = $('#Friends #text-option').val();
        // console.log('text: ', checkValue);
        $('#Friends .form-item.text').show();
        $('#Friends .form-item.file').hide();
    });

    $('#Friends .file-option').on('change', function () {
        // const checkValue = $('#Friends #file-option').val();
        // console.log('file: ', checkValue);
        $('#Friends .form-item.text').hide();
        $('#Friends .form-item.file').show();
    });
});
