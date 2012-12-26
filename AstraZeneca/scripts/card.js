var initialCardData = function() {
};

initialCardData.prototype = function() {
	var initialCards = [{
        "cardNumber":"461253932",
        "amount":20,
        "bonusPoints":60,
        "expireDate":"2013/12/06"
    },{
        "cardNumber":"723128745",
        "amount":76,
        "bonusPoints":22,
        "expireDate":"2014/10/16"
    },{
        "cardNumber":"912472185",
        "amount":104,
        "bonusPoints":56,
        "expireDate":"2014/11/24"
    }],

	getInitialCardsData = function() {
		return JSON.stringify(initialCards);
	};
    
	return {
		getInitialCardsData:getInitialCardsData,
	};
}();