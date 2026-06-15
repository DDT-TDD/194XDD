using System;
using System.IO;
using System.Net;
using System.Threading;
using System.Diagnostics;

class Program
{
    private static HttpListener listener;
    private static string baseDir;
    private static int port = 8194;
    private static bool running = true;

    static void Main(string[] args)
    {
        baseDir = AppDomain.CurrentDomain.BaseDirectory;

        // Find an available local port
        bool bound = false;
        for (int p = 8194; p < 9200; p++)
        {
            try
            {
                listener = new HttpListener();
                listener.Prefixes.Add("http://localhost:" + p + "/");
                listener.Start();
                port = p;
                bound = true;
                break;
            }
            catch
            {
                if (listener != null) { try { listener.Close(); } catch { } }
            }
        }

        if (!bound)
        {
            Console.WriteLine("ERROR: Could not find a free port.");
            Console.WriteLine("Press any key to exit.");
            Console.ReadKey();
            return;
        }

        Console.Title = "194XDD Arcade Server";
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine();
        Console.WriteLine("  ================================================");
        Console.WriteLine("   194XDD - Counter Attack Protocol");
        Console.WriteLine("   Arcade Server Running!");
        Console.WriteLine("  ================================================");
        Console.ForegroundColor = ConsoleColor.White;
        Console.WriteLine();
        Console.WriteLine("   URL: http://localhost:" + port);
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("   Press ENTER or close this window to stop.");
        Console.ForegroundColor = ConsoleColor.Gray;
        Console.WriteLine();

        // Server thread
        Thread serverThread = new Thread(ListenLoop);
        serverThread.IsBackground = true;
        serverThread.Start();

        // Open default browser
        try
        {
            Process.Start(new ProcessStartInfo("http://localhost:" + port) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine("  Could not open browser automatically: " + ex.Message);
            Console.WriteLine("  Please open http://localhost:" + port + " manually.");
        }

        // Wait for user to press Enter
        Console.ReadLine();
        running = false;

        try { listener.Stop(); } catch { }
        Console.WriteLine("  Server stopped. Goodbye!");
    }

    private static void ListenLoop()
    {
        while (running && listener.IsListening)
        {
            try
            {
                HttpListenerContext context = listener.GetContext();
                ThreadPool.QueueUserWorkItem(ProcessRequest, context);
            }
            catch { break; }
        }
    }

    private static void ProcessRequest(object state)
    {
        HttpListenerContext context = (HttpListenerContext)state;
        HttpListenerRequest request = context.Request;
        HttpListenerResponse response = context.Response;

        string urlPath = request.Url.LocalPath;
        if (urlPath.StartsWith("/")) urlPath = urlPath.Substring(1);
        if (string.IsNullOrEmpty(urlPath)) urlPath = "index.html";

        string filePath = Path.Combine(baseDir, urlPath.Replace('/', Path.DirectorySeparatorChar));

        if (File.Exists(filePath))
        {
            try
            {
                byte[] data = File.ReadAllBytes(filePath);
                string ext = Path.GetExtension(filePath).ToLowerInvariant();
                string mimeType;

                switch (ext)
                {
                    case ".html": case ".htm": mimeType = "text/html; charset=utf-8"; break;
                    case ".css": mimeType = "text/css; charset=utf-8"; break;
                    case ".js":  mimeType = "application/javascript; charset=utf-8"; break;
                    case ".json": mimeType = "application/json; charset=utf-8"; break;
                    case ".png": mimeType = "image/png"; break;
                    case ".jpg": case ".jpeg": mimeType = "image/jpeg"; break;
                    case ".gif": mimeType = "image/gif"; break;
                    case ".svg": mimeType = "image/svg+xml"; break;
                    case ".ico": mimeType = "image/x-icon"; break;
                    case ".woff": case ".woff2": mimeType = "font/woff2"; break;
                    default: mimeType = "application/octet-stream"; break;
                }

                response.ContentType = mimeType;
                response.ContentLength64 = data.Length;
                response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                response.OutputStream.Write(data, 0, data.Length);
            }
            catch
            {
                response.StatusCode = 500;
            }
        }
        else
        {
            response.StatusCode = 404;
        }

        try { response.Close(); } catch { }
    }
}
