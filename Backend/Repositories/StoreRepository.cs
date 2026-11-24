using Npgsql;
using System.Text.Json;
namespace Backend_GrupoA.Repositories;
public class StoreRepository(NpgsqlDataSource source)
{
 public Task<NpgsqlConnection> Open(CancellationToken ct) => source.OpenConnectionAsync(ct).AsTask();
 public static NpgsqlCommand Command(NpgsqlConnection c, string sql, params (string,object?)[] values) {
  var cmd=c.CreateCommand(); cmd.CommandText=sql;
  foreach(var (name,value) in values) cmd.Parameters.AddWithValue(name,value ?? DBNull.Value);
  return cmd;
 }
 public static async Task<int> Exec(NpgsqlConnection c,string sql,CancellationToken ct,params (string,object?)[] values) {
  await using var cmd=Command(c,sql,values); return await cmd.ExecuteNonQueryAsync(ct);
 }
 public static async Task<T?> Scalar<T>(NpgsqlConnection c,string sql,CancellationToken ct,params (string,object?)[] values) {
  await using var cmd=Command(c,sql,values); var value=await cmd.ExecuteScalarAsync(ct); return value is null or DBNull ? default : (T)value;
 }
 public static async Task<JsonElement> Json(NpgsqlConnection c,string sql,CancellationToken ct,params (string,object?)[] values) {
  var json=await Scalar<string>(c,sql,ct,values); return JsonSerializer.Deserialize<JsonElement>(json ?? "[]");
 }
}
