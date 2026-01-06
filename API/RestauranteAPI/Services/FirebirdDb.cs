// Mueve este archivo a: E:\RESTAURANTE\API\RestauranteAPI\Services\FirebirdDb.cs

using Microsoft.Extensions.Configuration;

namespace RestauranteAPI.Services
{
    public class FirebirdDb
    {
        private readonly string _connectionString;

        public FirebirdDb(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("FirebirdConnection") ?? 
                throw new ArgumentNullException(nameof(config));
        }

        public FirebirdSql.Data.FirebirdClient.FbConnection GetConnection()
        {
            return new FirebirdSql.Data.FirebirdClient.FbConnection(_connectionString);
        }
    }
}