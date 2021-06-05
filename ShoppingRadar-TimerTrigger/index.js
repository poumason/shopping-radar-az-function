module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue)
    {
        context.log('Shopping Radar is running late!');
    }
    context.log('Shopping Radar timer trigger function ran!', timeStamp);   
};