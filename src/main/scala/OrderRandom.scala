package web

import org.sat4j.minisat.orders.VarOrderHeap
import javax.jws.soap.SOAPBinding.Style

class OrderRandom(seed: Int) extends VarOrderHeap {

  val rand = scala.util.Random

  rand.setSeed(seed)

  override def select(): Int = {

    val nblits = 2 * this.lits.nVars() + 1;

    val unassigned = (2 to nblits).filter(this.lits.isUnassigned(_)).toSeq

    if (unassigned.isEmpty)
      return super.select()
    else {
      val shuffled = rand.shuffle(unassigned)
      val randPosition = rand.nextInt(unassigned.size)
      println(
        s"*** RandomPosition $randPosition from ${shuffled.mkString(",")} ***"
      )
      return unassigned(randPosition)
    }

  }

}
