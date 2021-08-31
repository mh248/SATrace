package web

case class TrailData(lit: Int, level: Int, reason: Seq[Int], learnt: Boolean)
case class TrailDataString(lit: String, level: Int, reason: Seq[String], learnt: Boolean)
object TrailDataString {
  def apply(t: TrailData, int2String: Map[Int, String]): TrailDataString = {
    def convertInt(lit: Int): String = {
      if (lit < 0) "-" + int2String(lit*(-1))
      else int2String(lit)
    }
    TrailDataString(convertInt(t.lit), t.level, t.reason.map(ta => convertInt(ta)), t.learnt)
  }
}

class Trace(int2String: Map[Int, String]) {
  var trace: Seq[(String,Option[Seq[TrailData]])] = Seq.empty
  var traceString: Seq[(String,Option[Seq[TrailDataString]])] = Seq.empty
  
  def addTrace(message: String): Unit = {
    trace :+= (message, None)
  }
  def addTrace(message: String, trail: Seq[TrailData]): Unit = {
    trace :+= (message, Some(trail))
  }

  def size = trace.size

  def getTrace(i: Int): Map[String,String] = trace(i) match {
    case (message, None) =>
      Map("message" -> message)
    case (message, Some(trail)) =>
      Map("message" -> message, "graph" -> getGraph(trail))
  }

  def getGraph(ts: Seq[TrailData]): String = {
    def neg(lit: String): String = {
      if (lit.startsWith("-")) {
        lit.tail
      } else {
        "-" + lit
      }
    }
    def abs(lit: String): String = {
      if (lit.startsWith("-")) {
        lit.tail
      } else {
        lit
      }
    }
    val trails = ts.map(t => TrailDataString(t,int2String))
    println(trails)
    val dg = new Digraph
    for (trail <- trails) {
     // if (trail.level > 0 || trail.learnt) {
       if (trail.learnt) dg.addNodeOpt(trail.lit, Map("color" -> "red"))
      var tooltip = ""
      if (trail.reason.size > 1) tooltip = trail.reason.mkString(" ")
      dg.addNodeOpt(trail.lit, Map("tooltip" -> tooltip))
      dg.setLevel(trail.lit, trail.level)
      
        if (trail.reason.size > 0) {
          for (from <- trail.reason; if abs(trail.lit) != abs(from)) {
            
            if (!trail.learnt) dg.addArc(neg(from), trail.lit)
            else dg.addArc(neg(from), trail.lit, Map("color" -> "red"))
          }
        }
     // }
    }
    /*
    // conflictFound: 2[F] 3[F] 1[F] , 2, 3
    dg.addNodeOpt("Conflict", Map("tooltip" -> "2 3 1"))
    dg.setLevel("Conflict", 2)
    dg.addArc("-2", "Conflict")
    dg.addArc("-3", "Conflict")
    dg.addArc("-1", "Conflict")
    // trail(0) = -1, reason = null
    dg.addNodeOpt("-1", Map("tooltip" -> "null"))
    dg.setLevel("-1", 1)
    // trail(1) = -3, reason = null
    dg.addNodeOpt("-3", Map("tooltip" -> "null"))
    dg.setLevel("-3", 2)
    // trail(2) = -2, reason = -2[T] 3[F] 1[F]
    dg.addNodeOpt("-2", Map("tooltip" -> "-2 3 1"))
    dg.setLevel("-2", 2)
    dg.addArc("-3", "-2")
    dg.addArc("-1", "-2")
    //
    */
    dg.toGraphviz()
  }
}
