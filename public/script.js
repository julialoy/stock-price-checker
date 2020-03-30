const checkSingleStock = () => {
  $.ajax({
    url: '/api/stock-prices',
    type: 'get',
    data: $('#testForm').serialize(),
    success: function(data) {
      $('#jsonResult').html(JSON.stringify(data));
    }
  });
};

const checkMultipleStocks = () => {
  $.ajax({
    url: '/api/stock-prices',
    type: 'get',
    data: $('#testForm2').serialize(),
    success: function(data) {
      $('#jsonResult').html(JSON.stringify(data));
    }
  });
};

$('#testForm').submit( evt => {
  console.log("SUBMIT BUTTON CLICKED");
  checkSingleStock();
  evt.preventDefault();
});

$('#testForm2').submit( evt => {
  console.log("SUBMIT BUTTON CLICKED");
  checkMultipleStocks();
  evt.preventDefault();
});


