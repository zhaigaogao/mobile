package cmcc.mobile.admin.util;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

public class TaskStatusTypeHanler extends BaseTypeHandler<String> {

	private static Map<String, String> properties = PropertiesUtil.readProperties("taskStatus.properties");

	@Override
	public void setNonNullParameter(PreparedStatement ps, int i, String parameter, JdbcType jdbcType)
			throws SQLException {
		ps.setString(i, parameter);
	}

	@Override
	public String getNullableResult(ResultSet rs, String columnName) throws SQLException {
		String code = rs.getString(columnName);
		if (rs.getRow() == 1) {
			code = String.valueOf(Integer.parseInt(code) + 1);
		}
		return properties.get(code);
	}

	@Override
	public String getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
		String code = rs.getString(columnIndex);
		if (rs.getRow() == 1) {
			code = String.valueOf(Integer.parseInt(code) + 1);
		}
		return properties.get(code);
	}

	@Override
	public String getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
		String code = cs.getString(columnIndex);
		return properties.get(code);
	}
}