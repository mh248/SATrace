package web

import org.sat4j.minisat.orders.VarOrderHeap

class OrderRandom(seed: Int) extends VarOrderHeap {

  val rand = scala.util.Random

  rand.setSeed(seed)

  override def select(): Int = {

    val nblits = 2 * this.lits.nVars() + 1;

    val unassigned = (2 to nblits).filter(this.lits.isUnassigned(_)).toSeq

    if (unassigned.isEmpty)
      return super.select()
    else {
      rand.nextInt(unassigned.size)
      val randPosition = rand.nextInt(unassigned.size)
      println(
        s"*** RandomPosition $randPosition from ${unassigned.mkString(",")} ***"
      )
      return unassigned(randPosition)
    }

  }

}
