module QueryHelper
	def get_uri(url)
		return URI.encode(url.gsub("&lt;","<").gsub("&gt;",">"))
	end
end
