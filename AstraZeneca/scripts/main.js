document.addEventListener("deviceready", onDeviceReady, false);

var mapElem,
cachedLocations = [];

// Apache Cordova is ready
function onDeviceReady() {
	// Prevent screen bounce
    
	$("#addCardView").on("touchend", "#buttonAddNewCardView", function() {
		addNewCard();
	});
    
    getInitialCardsData();

    // TODO: get all (where applicable) event handlers into the viewModels (hint: data-bind="click: handler")
    
	$("#cardsView").on("click", ".listCard", function(e) {
		var cardId = $(e.currentTarget).data('cardid');
		initSingleCardView(cardId);
        var $cardFront = $("#cardFront"),
	    $cardBack = $("#cardBack");
		appendCardFadeEffect($cardFront, $cardBack);
		app.navigate('#singleCardView');
	});
   
	$("#cardsView").on("touchend", ".deleteCardButton", function(e) {
    	
		var cardNumberToDelete = $(e.currentTarget).parent().data('cardid');
		var message = "Are you sure that you want to permanently delete card with number ?";
        
		$("#modalViewDeleteCardMessage").text(message);
		$("#deleteMessage").text("Card Id:");
		$("#deleteCardId").text(cardNumberToDelete);
		$("#modalViewDeleteCard").kendoMobileModalView("open");
		e.stopPropagation();
	});
    
	$("#modalViewDeleteCard").on("touchend", '#buttonModalViewDeleteCancel', function() {
		$("#modalViewDeleteCard").kendoMobileModalView("close");
	});
    
	$("#modalViewDeleteCard").on("touchend", '#buttonModalViewDeleteConfirm', function() {
		var cardNumberToDelete = $("#deleteCardId").text();
		deleteCard(cardNumberToDelete);
		$("#modalViewDeleteCard").kendoMobileModalView("close");
	});
    
	cardsData.init();
	cardsData.cards.bind("change", writeIntoLocalStorage);
    
}



function getPosition(handler) {
	navigator.geolocation.getCurrentPosition(handler, onGeolocationError, { enableHighAccuracy: true });
}

function getLocations(position, handler) {
	$.getJSON("http://www.starbucks.com/api/location.ashx?&features=&lat=" + position.coords.latitude + "&long=" + position.coords.longitude + "&limit=10",
			  function(data) {
				  var locations = [];
				  $.each(data, function() {
					  locations.push(
						  {
						  address: this.WalkInAddressDisplayStrings[0] + ", " + this.WalkInAddressDisplayStrings[1], 
						  latlng: new google.maps.LatLng(this.WalkInAddress.Coordinates.Latitude, this.WalkInAddress.Coordinates.Longitude)
					  });                
				  });
				  handler(locations);
			  }).error(function(error) {
				  alert(error.message);
			  });
}

function getInitialCardsData(){
    if(window.localStorage.getItem("cards")===null)
    {
        var cardData = new initialCardData(),
        initialCards = cardData.getInitialCardsData();
        localStorage.setItem("cards",initialCards);
    }
}

function storesShow(e) {
	$("#storesNavigate").kendoMobileButtonGroup({
		select: function() {
			if (this.selectedIndex == 0) {
				$("#storeswrap").hide();
				$("#mapwrap").show();
				google.maps.event.trigger(map, "resize");
			}
			else if (this.selectedIndex == 1) {
				$("#mapwrap").hide();
				$("#storeswrap").show();
			}
		},
		index: 0
	});
    
    
	var iteration = function() {
		getPosition(function(position) {
			// Use Google API to get the location data for the current coordinates
			var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            
			var myOptions = {
				zoom: 12,
				center: latlng,
				mapTypeControl: false,
				navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			mapElem = new google.maps.Map(document.getElementById("map"), myOptions);
			var marker = new google.maps.Marker({
				position: latlng,
				map: mapElem,
				title: "Your Location",
                zIndex:google.maps.Marker.MAX_ZINDEX
			});
        
			if (cachedLocations.length > 0) {
				setStiresViews(cachedLocations);
			}
			else {
            	
				getLocations(position, function(locations) {
					cachedLocations = locations;
					setStiresViews(locations);
				});
			}
		});
	};
	iteration();
}

var announcementData = [
	{ title: "Holiday Drinks Are Here", description: "Enjoy your favorite holiday drinks, like Pumpkin Spice Lattes.", url: "images/holiday.jpg" },
	{ title: "Register & Get Free Drinks", description: "Register any Jitterz card and start earning rewards like free drinks. Sign-up now.", url: "images/rewards.jpg" },
	{ title: "Cheers to Another Year", description: "Raise a cup of bold and spicy Jitterz Anniversary Blend.", url: "images/anniversary.jpg" }
];

function announcementListViewTemplatesInit() {
	$("#announcements-listview").kendoMobileListView({
		dataSource: kendo.data.DataSource.create({ data: announcementData }),
		template: $("#announcement-listview-template").html()
	});
}

function onGeolocationError(error) {
	alert(error.message);
}

function setStiresViews(locations) {
	var pinColor = "66CCFF";
	var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
											   new google.maps.Size(21, 34),
											   new google.maps.Point(0, 0),
											   new google.maps.Point(10, 34));
	var pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
												new google.maps.Size(40, 37),
												new google.maps.Point(0, 0),
												new google.maps.Point(12, 35));
    
	var markerImage = new google.maps.MarkerImage('icons/iconPin.png'),
	marker,
    currentMarkerIndex = 0;
    function createMarker(index){
        if(index<locations.length)
        marker = new google.maps.Marker({
			map: mapElem,
			animation: google.maps.Animation.DROP,
			position: locations[index].latlng,
			title: locations[index].address.replace(/(&nbsp)/g," "),
			icon: markerImage,
			shadow: pinShadow,
		});
        oneMarkerAtTime();
    }
    
	createMarker(0);
    function oneMarkerAtTime()
    {
        google.maps.event.addListener(marker,"animation_changed",function()
        {
           if(marker.getAnimation()==null)
            {
                createMarker(currentMarkerIndex+=1);
            }
        });
    }
	
	$("#stores-listview").kendoMobileListView({
		dataSource: kendo.data.DataSource.create({ data: locations}),
		template: $("#stores-listview-template").html()
	});
}

//Cards informations
// TODO: rename to cardsDataViewModel
var cardsData = kendo.observable({
	init:function() {
		var i;
		this._cardNumbers = {};
        var cards=[];
		if (window.localStorage.getItem("cards") !== null) {
            cards = JSON.parse(window.localStorage.getItem("cards"));
		}
		for (i = 0; i < cards.length; i+=1) {
			this._cardNumbers[cards[i].cardNumber] = i;
		}
		cardsData.set("cards", cards);
	},
	cardNumbers: function(value) {
		if (value) {
			this._cardNumbers = value;
		}
		else {
			return this._cardNumbers;
		}
	},
	cards : []
});

function writeIntoLocalStorage(e) {
	var dataToWrite = JSON.stringify(cardsData.cards);
	window.localStorage.setItem("cards", dataToWrite);
}

function focusCardNumber() {
    $('#cardNumberField').focus();
}

function addNewCard() {
	var cardNumberValue = $('#cardNumberField').val();
    
	var isValidCardNumber = validateCardNumber(cardNumberValue),
	isDuplicateCardNumber = isDublicateNumber(cardNumberValue);
    
	var $addnewCardErrorLog = $('#addNewCardErrorLog'),
	$modalViewCardNumber = $('#modalViewAddCard');
    
	if (!isValidCardNumber) {
		$addnewCardErrorLog.text('Card number is nine digits code');
	}
	else if (isDuplicateCardNumber) {
		$addnewCardErrorLog.text('Dublicate record');
	}
	else {
		var currentAmount = Math.floor((Math.random() * 100) + 10),
		    bonusPoints = Math.floor(Math.random() * 100),
            currentDate = new Date(),    
            expireDate = currentDate.setFullYear(currentDate.getFullYear() + 2);
        
		var cardToAdd = {
			cardNumber : cardNumberValue,
			amount: currentAmount,
			bonusPoints: bonusPoints,
            expireDate: kendo.toString(expireDate, "yyyy/MM/dd")
		}
        
		var positionAdded = cardsData.cards.push(cardToAdd) - 1;
		cardsData.cardNumbers()[cardNumberValue] = positionAdded;
        
		$addnewCardErrorLog.text('');
		app.navigate("#cardsView");
	}
}

function validateCardNumber(cardNumberValue) {
	var validateNumberRegex = /^[0-9]{9}$/;
	var isValidCardNumber = validateNumberRegex.test(cardNumberValue);
    
	return isValidCardNumber;
}

function isDublicateNumber(cardNumberValue) {
	var isDublicate = cardsData.cardNumbers().hasOwnProperty(cardNumberValue);
	return isDublicate;
}

function listViewCardsInit() {
   
}

function appendCardFadeEffect($cardFront, $cardBack) {

	$cardFront.click(function(e) {
		$(e.currentTarget).fadeOut(500, "linear", function() {
			$cardBack.fadeIn(500, "linear");
		});

	});
    
	$cardBack.click(function(e) {
		$(e.currentTarget).fadeOut(500, "linear", function() {
			$cardFront.fadeIn(500, "linear");
		});
	});
}

function deleteCard(cardId) {
	var allCardsArray = cardsData.cards;
    
	for (var i = -1, len = allCardsArray.length; ++i < len;) {
		if (allCardsArray[i].cardNumber === cardId) {
			allCardsArray.splice(i, 1);
			delete cardsData.cardNumbers()[cardId];
			break;
		}
	} 
}

function generateBarcodeUrl(cardId) {
    
	var size = "130",
    	urlSizeParameter = "chs=" + size + "x" + size,
    	urlQrParameter = "cht=qr",
    	urlDataParameter = "chl=" + cardId,
    	urlBase = "https://chart.googleapis.com/chart?",
    	imageRequestString = urlBase + urlSizeParameter + "&" + urlQrParameter + "&" + urlDataParameter; 
    
	return imageRequestString;
}

// TODO: get this into the view model
// of the view it initializes
function initSingleCardView(cardId) {
    singleCardViewModel.setValues.call(singleCardViewModel, cardId);
}

var singleCardViewModel = new kendo.observable({
    setValues: function(cardId) {
        var that = this,
            cardPosition = cardsData.cardNumbers()[cardId],
            currentCard = cardsData.cards[cardPosition];
        if(currentCard.bonusPoints<50)
         {
            $("#cardFront").removeClass("gold").addClass("silver");
            $("#cardBack").removeClass("gold").addClass("silver");
        } else {
            $("#cardFront").removeClass("silver").addClass("gold");
            $("#cardBack").removeClass("silver").addClass("gold");
        }
        that.set("barcodeUrl", generateBarcodeUrl(cardId));
		that.set("cardId","#" + cardId);
		that.set("cardAmount", kendo.toString(currentCard.amount, "c"));
		that.set("barcodeURL", currentCard.bonusPoints);
		that.set("currentDate", kendo.toString(new Date(), "yyyy/MM/dd hh:mm tt"));
    },
    
    barcodeUrl : "",
	cardId : "",
	cardAmount : "",
	bonusPoints : "",
	currentDate : ""
});

function singleCardShow() {
    
}

function processDeleteCard() {
    var cardIdString = singleCardViewModel.cardId,
        cardIdLength = singleCardViewModel.cardId.length,
        cardId = cardIdString.substring(1, cardIdLength);
    deleteCard(cardId);
    app.navigate('#cardsView');
}

/*------------------- Rewards ----------------------*/

var rewardCards = {
	gold : {
		imageURLFront:"http://www.arbolcrafts.co.uk/images/gold%20card%20blanks.jpg",
		imageURLBack:"http://www.arbolcrafts.co.uk/images/gold%20card%20blanks.jpg",
		rewards:[
			{reward:"Free coffee every day"},
			{reward:"Free refill"},
			{reward:"Free cookies with every drink"}
		]
	},
	silver:{
		imageURLFront:"http://originalgiftsforwoman.com/wp-content/uploads/2012/02/prepaid-gift-cards.s600x600-300x190.jpg",
		imageURLBack:"http://originalgiftsforwoman.com/wp-content/uploads/2012/02/prepaid-gift-cards.s600x600-300x190.jpg",
		rewards:[
			{reward:"Free refill"},
			{reward:"Free cookies with every drink"}
		]
	}
};

function rewardsViewInit() {
    
}

var rewardsViewModel = new kendo.observable({
		setBonusPoints: function(e){
            var that = this,
            bonusPointsReceived=e.view.params.bonusPoints,
            bonusCardBarcodeSeq = e.view.params.cardNumber+"bonus",
            currentCard = null,
            barcode =generateBarcodeUrl(bonusCardBarcodeSeq) ;
            that.set("cardNumber","#"+e.view.params.cardNumber);
            that.set("bonusPoints","Bonus:"+bonusPointsReceived);
            if(bonusPointsReceived<50)
             {
                currentCard = rewardCards["silver"];
                $("#rewardCardFront").removeClass("gold").addClass("silver");
                $("#rewardCardBack").removeClass("gold").addClass("silver");
            } else {
                currentCard = rewardCards["gold"];
                $("#rewardCardFront").removeClass("silver").addClass("gold");
                $("#rewardCardBack").removeClass("silver").addClass("gold");
            }
            that.set("rewards",currentCard.rewards);
            that.set("imageUrlFront",'url('+currentCard.imageURLFront+ ')');
            that.set("imageUrlBack",'url('+currentCard.imageURLBack + ')');
            that.set("barcodeURL",barcode);
            that.set("currentDate",kendo.toString(new Date(), "yyyy/MM/dd hh:mm tt" ))
		},
		imageUrlFront: "",
		imageUrlBack: "",
		rewards: [],
		bonusPoints:0,
        barcodeURL:"",
        currentDate:"",
        cardNumber:""
	});

function rewardCardShow() {
	rewardsViewModel.setBonusPoints.apply(rewardsViewModel, arguments);
	var $rewardCardFront = $("#rewardCardFront"),
	    $rewardCardBack = $("#rewardCardBack");
    
	appendCardFadeEffect($rewardCardFront, $rewardCardBack);
}
