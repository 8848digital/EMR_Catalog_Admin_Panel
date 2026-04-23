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
const yDiscOperation = require('./yDisc');
const voucherBatchOperation = require('./voucherBatch');
const voucherOperation = require('./voucher');
const yPromoOperation = require('./yPromo');
const yEcheMapOperation = require('./yEcheMap');
const yDiscSlbOperation = require('./yDiscSlb');
const yEchelonOperation = require('./yEchelon');
const yDiscTypOperation = require('./yDiscTyp');
const yIngTrgtOperation = require('./yIngTrgt');
const ySlabBasOperation = require('./ySlabBas');
const yStckGrpOperation = require('./yStckGrp');
const yValModeOperation = require('./yValMode');
const yDStoreOperation = require('./yDStore');
const yOrdLvlOperation = require('./yOrdLvl');
const yDiscFocOperation = require('./yDiscFoc');
const yEmpCeilOperation = require('./yEmpCeil');

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
    add_pos: posOperation,
    add_yDisc: yDiscOperation,
    add_voucherBatch: voucherBatchOperation,
    add_voucher: voucherOperation,
    add_yPromo: yPromoOperation,
    add_yEcheMap: yEcheMapOperation,
    add_yDiscSlb: yDiscSlbOperation,
    add_yEchelon: yEchelonOperation,
    add_yDiscTyp: yDiscTypOperation,
    add_yIngTrgt: yIngTrgtOperation,
    add_ySlabBas: ySlabBasOperation,
    add_yStckGrp: yStckGrpOperation,
    add_yValMode: yValModeOperation,
    add_yDStore: yDStoreOperation,
    add_yOrdLvl: yOrdLvlOperation,
    add_yDiscFoc: yDiscFocOperation,
    add_yEmpCeil: yEmpCeilOperation
};
