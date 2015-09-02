
var Helpers = (function(){


    /**
     * @function milliSecondsToTimeString
     * @public
     */
    var milliSecondsToTimeString =  function(value){

        var hours = Math.floor(value / ( 1 * 60 * 60 * 1000) % 24),
            minutes = Math.floor(value / ( 1 * 60 * 1000) % 60)

        return _formatDoubleDigit(hours) + ":" + _formatDoubleDigit(minutes);
    }


    /**
     * @function _formatDoubleDigit
     * @private
     */
    var _formatDoubleDigit = function(digit){

        return ('0' + digit).slice(-2);
    };


    return {
        milliSecondsToTimeString : milliSecondsToTimeString
    };

})();

module.exports = Helpers;