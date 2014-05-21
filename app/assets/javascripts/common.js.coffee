
@get_server_address =->
	return window.location.protocol + "//" + window.location.host

@show_loading =->
	$("#loading").show()

@hide_loading =->
	$("#loading").hide()

@html_safe = (str)->
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

@break_words = (str)->
	words = str.split(" ")
	result = ""
	i = 0
	while i < words.length
		if words[i].length > 50
			new_word = ""
			j = 0
			while j < words[i].length
				if j > 0
					new_word += "- "
				new_word += words[i].substring(j, j+40)
				j = j+40
			words[i] = new_word
		if i>0
			result += " "
		result += words[i]
		i++
	return result
