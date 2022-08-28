const retrieveAll = () => {
    const results = YouTube.Channels.list(
        "id,snippet,contentDetails",{mine:true}
    );
    console.log(results);
    for(let result of results.items){
        console.log(result);
    }
};