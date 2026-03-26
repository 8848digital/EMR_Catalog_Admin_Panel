const custMstOperation = require('./custMst');
const emailOperation = require('./email');
const designSizeOperation = require('./designSize');
const usrMapOperation = require('./usrMap');
const csGrdOperation = require('./csGrd');
const custMpOperation = require('./custMp');
const diaGrdOperation = require('./diaGrd');
const roleOperation = require('./role');
const slsPrsnOperation = require('./slsPrsn');
const metCdOperation = require('./metCd');
const metColOperation = require('./metCol');
const metKtOperation = require('./metKt');
const ctgFilterOperation = require('./ctgFilter');
const rgFilterOperation = require('./rgFilter');
const advEventOperation = require('./advEvent');
const PosCTAOperation = require('./PosCTA');
const usersOperation = require('./users');
const posInvoiceOperation = require('./posInvoice');
const posOperation = require('./pos');

module.exports = {
    add_custMst: custMstOperation,
    add_email: emailOperation,
    add_design_size: designSizeOperation,
    add_usr_map: usrMapOperation,
    add_cs_grd: csGrdOperation,
    add_cust_mp: custMpOperation,
    add_dia_grd: diaGrdOperation,
    add_role: roleOperation,
    add_sls_prsn: slsPrsnOperation,
    add_met_cd: metCdOperation,
    add_met_col: metColOperation,
    add_met_kt: metKtOperation,
    add_ctg_filter: ctgFilterOperation,
    add_rg_filter: rgFilterOperation,
    add_adv_event: advEventOperation,
    add_PosCTA: PosCTAOperation,
    add_Users: usersOperation,
    add_pos_invoice: posInvoiceOperation,
    add_pos: posOperation
};
