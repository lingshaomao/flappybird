
module.exports = {
    isEmail: function (str) {
        return typeof str === 'string' && str.length > 5 && str.length < 61 && /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(str);
    }
};