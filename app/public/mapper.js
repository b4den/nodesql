let url
let post_data = ''
let cookie_data = ''

$("#data-btn").on('click', function(e) {
  var tree = $("#tree").fancytree("getTree")

  /* Loop through the tree and get the selected value, then walk up, then down
    This will ensure we're always getting the column data for the last clicked*/
  let selected_values = []
  tree._lastMousedownNode.parent.children.forEach( (x) => {
    if (x.selected) selected_values.push(x.title)
  })
  let database = tree._lastMousedownNode.parent.children[0].parent.parent.title
  let table = tree._lastMousedownNode.parent.children[0].parent.title
  let columns = selected_values.toString()

  // check cookies
  if ($("#inputcookiedata").val()  != '' && $("#cookiecheck").is(":checked") )
    cookie_data = `${$("#inputcookiedata").val()}`
  else cookie_data = ''

  // check if we need to add post params to our GET request
  let data_to_post = ''
  if ( $("#inputpostdata").val() != '' )  data_to_post = `${btoa(post_data)}`
  else data_to_post = ''
  
  // check if we need to perform a fullscan
  let fullscan = ''
  if ( $("#fullscancheck").is(":checked") )  fullscan = 'true' 


  cookie_data = btoa(cookie_data)
  $.ajax({
    url: `/api/tree_dump`, 
    type: "get",
    data: {
      "url": url,
      "database": database,
      "table": table,
      "columns": columns,
      "cookie": cookie_data,
      "fullscan": fullscan,
      "postdata": data_to_post,
    },
    beforeSend: () => {
      $("#data-btn").prop("disabled", true)
      setLoading($("#data-btn"))
    },
    success: data_success,
    complete: () => {
      $("#data-btn").prop("disabled", false)
      clearLoading($("#data-btn"))
    }
  })
})

const append_to_log = (message, type=null) => {
  if (!type)
    $("#log").append(`[*] ${message}</br>`)
  if (type == "success")
    $("#log").append(`<font color="green">[*] <strong>${message}</strong></font></br>`)
  else if (type == "error")
    $("#log").append(`<font color="red">[*] <strong>${message}</strong></font></br>`)

  let objDiv = document.getElementById("log");
  objDiv.scrollTop = objDiv.scrollHeight;
}

const setLoading = (id) => {
  var search = id
  if (!search.data('normal-text')) {
    search.data('normal-text', search.html());
  }
  search.html(search.data('loading-text'));
};

const clearLoading = (id) => {
  var search = id
  search.html(search.data('normal-text'));
};

const data_success = (data) => {
  add_to_table(data)
  append_to_log(`Successfully extracted ${data.length} rows!`, "success")
}

const add_to_table = (data) => {

  let header = data.shift()
  append_header(header)
  for (var i = 0; i < data.length; i++) {

    $("#tbl-data tbody").append(`<tr>`)
    for (var item of data[i]) {
      $("#tbl-data tbody").append(`<td>${item}</td>`)
    }

    $("#tbl-data tbody").append(`</tr>`)
  }
}

const append_header = (data) => {
  /* lets clear the header and body */
  $("#tbl-data thead tr").html('')
  $("#tbl-data tbody").html('')


  for (var i = 0; i < data.length; i++) {
    $("#tbl-data thead tr").append(`<th scope="col">${data[i]}</th>`)
  }
}
/* Visiblity stuff */

/* toggle visibility when post-data is enabled */
$('#postdatacheck').click(function() {
  if ($(this).is(':checked')) {
    $("#post-data-div").removeAttr('style')
  }
  else { 
    $("#post-data-div").attr('style', 'display: none;')
  }
})

$('#cookiecheck').click(function() {
  if ($(this).is(':checked')) {
    $("#cookie-data-div").removeAttr('style')
  }
  else { 
    $("#cookie-data-div").attr('style', 'display: none;')
  }
})

/* end visibility */


$("#target").on('submit', function(e) {
  /* prevent the form from submitting */
  e.preventDefault();

  url = $("#inputurl").val()
  url = btoa(url)

  post_data = $("#inputpostdata").val()

  append_to_log(`performing SQL injection scan on ${atob(url)}`)
  
  // check cookies
  if ( $("#inputcookiedata").val() != '' && $("#cookiecheck").is(":checked") )
    cookie_data = $("#inputcookiedata").val()
  else
    cookie_data = ''

  cookie_data = btoa(cookie_data)
  $("#tree").fancytree({
    checkbox: true,
    //source:  db_sources,
    source: source_get_databases(url, post_data),
    selectMode: 3,
    activate: function(event, data){
      //$("#status").text("Activate: " + data.node);
      console.log("Activate: " + data.node);
    },
    lazyLoad:  lazy_load,
    loadChildren: function(event, data) {
      // Apply parent's state to new child nodes:
      data.node.fixSelection3AfterClick();
    },
  });
})

const source_get_databases = (url, post_data='') => {
  return $.ajax({
    url: `/api/tree_databases`,
    method: 'get',
    timeout: 0,
    data: {
      "url": url,
      "cookie": cookie_data,
      "postdata": btoa(post_data)
    },
    beforeSend: () => {
      $("#submit-btn").prop("disabled", true)
      setLoading($("#submit-btn") )
    },
    success: get_success,
    complete: () => {
      $("#submit-btn").prop("disabled", false)
      clearLoading($("#submit-btn") )
    }
  })
}

const lazy_load = (event, data) => {
  let node = data.node
  if (node.key == "database") {

    data.result = {
      url: '/api/tree_tables',
      data: {"url": url, "database": node.title, postdata: btoa(post_data), cookie: cookie_data },
      cache: false
    }
  }
  else if (node.key == "table") {
    data.result = {
      url: '/api/tree_columns',
      data: {"url": url, "database": node.parent.title, "table": node.title, postdata: btoa(post_data), cookie: cookie_data},
      cache: false
    }
    /* now enable button */
    $("#data-btn").prop("disabled", false)
    /* now log */
  }
  else {
    data.result = []
  }
}

const get_success = (data) => {
  // remove server information
  $(".temp-stats").remove()

  if (data.length > 1){
    $("#inject").attr('style', 'color: green;')
    $("#inject").attr('class', 'fa fa-check')
    append_to_log(`${atob(url)} is vulnerable!`, "success")
    append_to_log(`detected ${data.length} databases: ${data.map( (x) => x.title)}`, "success")

    let server_info = data[0].server_info
    let html_data = ''
    Object.keys(server_info).forEach( (x) => { 
      let attr = ''
      if (x == "tech")  {
        attr = "file-code-o"
      } else if (x == "db") {
        attr = "database"
      } else {
        attr = "server"
      }
      html_data+=(`<span class="badge pull-right temp-stats">${server_info[x]} 
        <i id="inject" class="fa fa-${attr}" style="color: green"></i> </span>`)
    })

    $("#stats").append(html_data)
  }
  else {
    $("#inject").attr('style', 'color: red;')
    $("#inject").attr('class', 'fa fa-times')
    append_to_log(`${atob(url)} is not vulnerable..`, "error")
  }
}

