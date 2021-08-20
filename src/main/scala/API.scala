package web

import scala.collection.JavaConverters._
import javax.servlet.http._

class API extends HttpServlet {

  override def doGet(request: HttpServletRequest, response: HttpServletResponse) = {
    try {
      val command: String = request.getParameter("c")
      val params: Map[String,Seq[String]] =
        request.getParameterMap().asScala.toMap.map { case (k,v) => k -> v.toSeq }
      println(s"API: $command, $params")
      val session: HttpSession = request.getSession(true)
      var handler = session.getAttribute("Handler").asInstanceOf[Handler]
      if (handler == null) {
        handler = new Handler
        session.setAttribute("Handler", handler)
        println("new handler")
      }
      println(handler)
      handler.exec(command, params) match {
        case Some(str) => {
          response.setContentType("application/json")
          response.setCharacterEncoding("UTF-8")
          response.getWriter.write(str)
        }
        case _ => {
          response.sendError(HttpServletResponse.SC_BAD_REQUEST)
        }
      }
    } catch {
      case e: Exception => {
        response.sendError(HttpServletResponse.SC_BAD_REQUEST)
        e.printStackTrace()
      }
    }
  }

  override def doPost(request: HttpServletRequest, response: HttpServletResponse) =
    doGet(request, response)
}
