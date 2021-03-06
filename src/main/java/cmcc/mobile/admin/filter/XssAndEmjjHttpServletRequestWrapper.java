package cmcc.mobile.admin.filter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

import org.apache.log4j.Logger;

/**
 * 恶意代码和emjj表情过滤
 *
 * @author renlinggao
 * @Date 2016年6月21日
 */
public class XssAndEmjjHttpServletRequestWrapper extends HttpServletRequestWrapper {

	private Logger logger = Logger.getLogger(this.getClass());

	public XssAndEmjjHttpServletRequestWrapper(HttpServletRequest servletRequest) {
		super(servletRequest);
	}

	public String[] getParameterValues(String parameter) {
		String[] values = super.getParameterValues(parameter);
		if (values == null) {
			return null;
		}
		int count = values.length;
		String[] encodedValues = new String[count];
		for (int i = 0; i < count; i++) {
			encodedValues[i] = cleanXSS(values[i]);
		}
		return encodedValues;
	}

	public String getParameter(String parameter) {
		String value = super.getParameter(parameter);
		if (value == null) {
			return null;
		}
		return cleanXSS(value);
	}

	public String getHeader(String name) {
		String value = super.getHeader(name);
		if (value == null)
			return null;
		return cleanXSS(value);
	}

	private String cleanXSS(String value) {
		// You'll need to remove the spaces from the html entities below
		// value = HtmlUtils.htmlEscapeDecimal(value);
		// value = value.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
		// value = value.replaceAll("\\(", "&#40;").replaceAll("\\)", "&#41;");
		// value = value.replaceAll("'", "&#39;");
		// value = value.replaceAll("eval\\((.*)\\)", "");
		// value = value.replaceAll("[\\\"\\\'][\\s]*javascript:(.*)[\\\"\\\']",
		// "\"\"");
		// value = value.replaceAll("script", "");
		// 过滤emjj表情
		value = value.replaceAll("[\ud83c\udc00-\ud83c\udfff]|[\ud83d\udc00-\ud83d\udfff]|[\u2600-\u27ff]", "");
		logger.debug("过滤后的参数值：" + value);
		return value;
	}
}
