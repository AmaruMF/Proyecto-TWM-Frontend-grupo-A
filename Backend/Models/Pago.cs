using System;
using System.Collections.Generic;

namespace TiendaMultiplaza.API.Models;

public partial class Pago
{
    public int CodigoTransferencia
    {
        get; set;
    }

    public int MedioPagoId
    {
        get; set;
    }

    public string Ultimos4DigitosTarjeta { get; set; } = null!;

    public virtual Venta CodigoTransferenciaNavigation { get; set; } = null!;
}
