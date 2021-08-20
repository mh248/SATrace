package web

class Digraph {
  var nodeOpt: Map[String,Map[String,String]] = Map.empty
  var arcs: Seq[(String,String)] = Seq.empty
  var arcOpt: Map[(String,String),Map[String,String]] = Map.empty
  var nodeLevelMap: Map[String,Int] = Map.empty
  var levelNodesMap: Map[Int,Set[String]] = Map.empty

  def addNode(node: String): String = {
    if (! nodeOpt.contains(node))
      nodeOpt += node -> Map("label" -> node)
    node
  }
  def addNodeOpt(node: String, opt: Map[String,String]): Unit = {
    if (! nodeOpt.contains(node))
      addNode(node)
    nodeOpt += node -> (nodeOpt(node) ++ opt)
  }
  def addArc(node1: String, node2: String, opt: Map[String,String] = Map.empty): Unit = {
    arcs :+= (addNode(node1), addNode(node2))
    if (opt.size != 0)
      arcOpt += (node1,node2) -> opt
  }
  def setLevel(node: String, level: Int): Unit = {
    nodeLevelMap += node -> level
    val nodes = levelNodesMap.getOrElse(level, Set.empty)
    levelNodesMap += level -> (nodes + node)
  }
  def isRoot(node: String) = ! arcs.exists(_._2 == node)
  def sameLevel(node1: String, node2: String) =
    nodeLevelMap.getOrElse(node1, -1) == nodeLevelMap.getOrElse(node2, -1)
  def toGraphviz(bottomUp: Boolean = true, constraint: Boolean = false): String = {
    val fontname = "helvetica";
    val sb = new StringBuilder
    def nodeDefinition(node: String): String = {
      val opt = nodeOpt(node).map {
        case (k,v) => s"""$k = "$v""""
      }.mkString(",")
      s"""  "$node" [$opt];\n"""      
    }
    sb.append("digraph {\n");
    sb.append("rankdir=LR;\n");
    sb.append(s"""graph [fontname="$fontname",splines=ortho];"""+"\n")
    sb.append(s"""node [fontname="$fontname"];"""+"\n")
    sb.append(s"""edge [fontname="$fontname"];"""+"\n")
    var nodes = nodeOpt.keySet
    val levels = levelNodesMap.keys.toSeq.sorted
    val cs = levels.map("c"+_)
    for (level <- levels) {
      // sb.append(s"""c$level [label="Level $level",shape=none];"""+"\n")
      sb.append(s"c$level [style=invis];\n")
    }
    if (levels.size > 1) {
      sb.append("{ rank=same; " + cs.mkString("; ") + " }\n")
      if (bottomUp)
        sb.append(cs.reverse.mkString(" -> ") + " [style=invis];\n")
      else
        sb.append(cs.mkString(" -> ") + " [style=invis];\n")
    }
    for (level <- levels) {
      sb.append(s"subgraph cluster_$level {\n")
      sb.append("  color = gray;\n")
      sb.append(s"""  label = "L$level";"""+"\n")
      sb.append("  labelloc = t;\n")
      sb.append("  labeljust = l;\n")
      for (node <- levelNodesMap(level))
        sb.append(nodeDefinition(node))
      sb.append("}\n")
      for (node <- levelNodesMap(level).filter(isRoot))
        sb.append(s"""c$level -> "$node" [style=invis];\n""")
      nodes = nodes diff levelNodesMap(level)
    }
    for (node <- nodes)
      sb.append(nodeDefinition(node))
    for (a <- 0 until arcs.size) {
      val arc = arcs(a)
      val (node1,node2) = arc
      var opt = arcOpt.getOrElse(arc, Map.empty)
      if (! sameLevel(node1, node2)) {
        opt += "color" -> "gray"
        if (! constraint)
          opt += "constraint" -> "false"
      }
      val s = opt.map {
          case (k,v) => s"""$k = "$v""""
      }.mkString(",")
      sb.append(s""""$node1" -> "$node2" [$s];\n""")
    }
    sb.append("}\n");
    sb.toString
  }
}
