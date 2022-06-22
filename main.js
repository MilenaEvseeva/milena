<%
SERVER_TEMPLATE = OpenDoc(UrlFromDocID(7026428212512183564));
SHOW_RESULT_USER = tools_web.is_true(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'SHOW_RESULT_USER'").value);
SHOW_COMPETENCE_RESULT_USER = tools_web.is_true(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'SHOW_COMPETENCE_RESULT_USER'").value);
ASSESSMENT_APPRAISE_ID = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'ASSESSMENT_APPRAISE_ID'").value, null);
GROUP_FOR_ASSESSMENT = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'GROUP_FOR_ASSESSMENT'").value, null);
ASPIRE_GROUP = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'ASPIRE_GROUP'").value, null);

PERSONAL_IPR_GROUP = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'PERSONAL_IPR_GROUP'").value, null);
TEAM_IPR_GROUP = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'TEAM_IPR_GROUP'").value, null);

MAIN_BOSS_TYPE_ID = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'MAIN_BOSS_TYPE_ID'").value, null);
NOOB_DATE = ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'NOOB_DATE'").value;
NOOB_DATE = NOOB_DATE == "" ? null : DateNewTime(Date(NOOB_DATE));
ASSESSMENT_CLOSE = tools_web.is_true(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'ASSESSMENT_CLOSE'").value);
// Для сотрудников этой группы все компетенции обязательные
ALL_COMPETENCE = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'ALL_COMPETENCE'").value, null);
ACTIVATE_NOTIFICATION = tools_web.is_true(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'ACTIVATE_NOTIFICATION'").value);
NO_AVATAR_ID = 6973931295549759668;
IMG_BASE_URL = "";
YEAR = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'CUR_YEAR'").value, null);
COMPETENCE_ASSESSMENT_APPRAISE = ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'COMPETENCE_ASSESSMENT_APPRAISE'").value;
COMPETENCE_APPRAISES = [];
for (el in tools.read_object(COMPETENCE_ASSESSMENT_APPRAISE)) {
    COMPETENCE_APPRAISES.push({
        id: Trim(Int(el.__value)),
        name: Trim(el.comment)
    })
}
TOTAL_ASSESSMENT_APPRAISE = ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'TOTAL_ASSESSMENT_APPRAISE'").entries;
TOTAL_APPRAISES = [];
for (el in TOTAL_ASSESSMENT_APPRAISE) {
    TOTAL_APPRAISES.push({
        id: Trim(el.id),
        name: Trim(el.name)
    })
}


// ЕСЛИ АДМИНИСТРАТОР ИСПОЛЬЗУЕТ ПОДМЕНУ, ТО МЕНЯЕМ ЕГО ДАННЫЕ НА СВОЙСТВА УКАЗАННОГО ПОЛЬЗОВАТЕЛЯ (ДЛЯ ПРОСМОТРА ЕГО БЛАНКА)
try {
    var libVersion = '?v=' + DateToRawSeconds(Date());
    var lib = OpenCodeLib('x-local://wt/web/homecreditnew/assessment/login_as/login_as.lib.js' + libVersion);
  
    if ( lib.isSubstitutionAllowed(curUserID ) ) {
      var substitution = lib.getSubstitution(curUserID);
      if (substitution != null && Int(substitution.GetOptProperty('id', 0)) != 0) {
        //alert('SUBSTITUTION DATA: ' + tools.object_to_text(substitution, 'json'));
        var curUserID = Int(substitution.id);
          var curUser = tools.open_doc(curUserID).TopElem;
      }
    }
} catch(e) {
    alert('SUBSTITUTION ERROR: \n' + e);
}
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  

try {
    curUserID == true 
} catch (e) {
    IMG_BASE_URL = "https://agent-learn.vsk.ru";
    //var curUserID =  6992666342957267997 // Оля
    var curUserID = 6992666023990938310; // Я
    //var curUserID = 6992666656314124604; // Лариса
    //var curUserID = 6992668704882777328 // Аня

    var curUser = tools.open_doc(curUserID).TopElem;
}

// Получение оценок компетенций по текущий процедуре для вывода руководителю
function getCurAssessmentCompetence(user_id) {
    function _getTrueValue(res) {
        if ( res == "Не соответствует ожиданиям" ) {
            return "1"
        } else if ( res == "Ниже ожиданий" ) {
            return "2"
        } else if ( res == "Соответствует ожиданиям" ) {
            return "3"
        } else if ( res == "Выше ожиданий" ) {
            return "4"
        } else if ( res == "Потрясающе" ) {
            return "5"
        }
        return "";
    }
    var result = [{
        id: "total_result",
        title: "Итоговая оценка",
        value: "",
    }];
    var findBossPa = ArrayOptFirstElem(XQuery("for $elem in pas where \n\
        $elem/person_id = " + user_id + " \n\
        and $elem/assessment_appraise_id = " + ASSESSMENT_APPRAISE_ID + " \n\
        and $elem/assessment_appraise_type = 'competence_appraisal' \n\
        and $elem/status = 'manager' \n\
    return $elem"));
    if (findBossPa == undefined) {
        result = [];
        return result;
    }
    var bossPaCard = tools.open_doc(findBossPa.id);
    result[0].value = _getTrueValue(Trim(bossPaCard.TopElem.custom_elems.ObtainChildByKey("main_point").value));
    for (el in bossPaCard.TopElem.competences) {
        // Найдем аналогичные данные по сотруднику
        compCard = tools.open_doc(el.competence_id);
        result.push({
            id: Trim(el.competence_id),
            title: Trim(compCard.TopElem.name),
            value: Trim(el.mark_text)
        })
    }
    return result;
}

function getHistory(user_id, type) {
    var result = [];
    if (type == "total") {
        for (el in TOTAL_APPRAISES) {
            if (el.id == Trim(YEAR)) {
                result.push(el);
                continue;
            }
            findTotals = ArrayOptFirstElem(XQuery("sql: \n\
                declare @user_id bigint = "+user_id+"; \n\
                SELECT \n\
                    at.id \n\
                FROM \n\
                    cc_hc_totals as at \n\
                WHERE \n\
                    at.person_id = @user_id \n\
                    and at.year = '"+el.id+"' \n\
                    and at.status != 'Черновик' \n\
                    and at.is_close != 1 \n\
                    and at.global_locked != 1 \n\
            "));
            if ( findTotals != undefined ) {
                result.push(el);
            }
        }
    } else {
        for (el in COMPETENCE_APPRAISES) {
            findCompetence = ArrayOptFirstElem(XQuery("for $elem in assessment_plans \n\
                where $elem/assessment_appraise_id = "+el.id+" \n\
                and $elem/person_id = " + user_id + " \n\
            return $elem"));
            if ( findCompetence != undefined ) {
                result.push(el);
            }
        }
    }
    return result
}

function isCurUserNoob() {
    try {
        if ( Date(NOOB_DATE) <= Date(curUser.hire_date) ) {
            return true;
        } 
    } catch(e) {
        return false;
    }
    return false;
}

function getDeputy(id) {
    var deputy_id = OptInt(id, null);
    var result = {
        id: null,
        fullname: ""
    }
    if (deputy_id != null) {
        var deputyCard = tools.open_doc(deputy_id);
        result.id = Trim(deputyCard.TopElem.id);
        result.fullname = Trim(deputyCard.TopElem.fullname);
    }

    return result;
}

function get_Deputy(queryObjects) {
    var search = queryObjects.HasProperty("search_text") ? Trim(queryObjects.search_text) : "";
    var collsArr = XQuery("sql: \n\
        SELECT \n\
            TOP 5 \n\
            col.id, \n\
            col.fullname, \n\
            col.position_parent_name \n\
        FROM \n\
            collaborators as col \n\
        WHERE \n\
            col.id != " + curUserID + " \n\
            and col.is_candidate != 1 \n\
            and col.is_dismiss != '1' \n\
            and col.fullname LIKE ('%" + search + "%') \n\
    ");

    var result = [];
    for (col in collsArr) {
        result.push({
            fullname: Trim(col.fullname),
            subd: Trim(col.position_parent_name),
            id: Trim(col.id)
        });
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: result
    }, "json");
}

function isCurUserBoss() {
    var findGoalsUsers = ArrayOptFirstElem(XQuery("sql: \n\
        declare @boss_id bigint = "+curUserID+"; \n\
        declare @group_id bigint = "+GROUP_FOR_ASSESSMENT+"; \n\
        declare @boss_type_id bigint = "+MAIN_BOSS_TYPE_ID+"; \n\
        SELECT \n\
            fm.* \n\
        FROM \n\
            func_managers as fm \n\
            inner join group_collaborators as gc on gc.collaborator_id = fm.object_id \n\
            inner join collaborators as cols on gc.collaborator_id = cols.id \n\
        WHERE \n\
            fm.person_id = @boss_id \n\
            and fm.boss_type_id = @boss_type_id \n\
            and gc.group_id = @group_id \n\
            and cols.is_dismiss <> '1' \n\
    ")) == undefined ? false : true;

    var findCompetenceUsers = ArrayOptFirstElem(XQuery("sql: \n\
        declare @boss_id bigint = "+curUserID+"; \n\
        declare @assessment_appraise_id bigint = "+ASSESSMENT_APPRAISE_ID+"; \n\
        SELECT \n\
            pas.id \n\
        FROM \n\
            pas \n\
            inner join collaborators as cols on pas.person_id = cols.id \n\
        WHERE \n\
            pas.expert_person_id = @boss_id \n\
            and pas.assessment_appraise_id = @assessment_appraise_id \n\
            and pas.status = 'manager' \n\
            and.pas.assessment_appraise_type = 'competence_appraisal' \n\
            and cols.is_dismiss <> '1' \n\
    ")) == undefined ? false : true;    

    var isGoalsDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_hc_totals where \n\
        $elem/deputy_id = "+curUserID+" return $elem \n\
    ")) == undefined ? false : true;

    var isCompetenceDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_deputy_heads where \n\
        $elem/deputy_id = "+curUserID+" return $elem \n\
    ")) == undefined ? false : true;

    if ( findCompetenceUsers || findGoalsUsers || isGoalsDeputy || isCompetenceDeputy) {
        return true;
    }
    return false;
}

function isUserInAspire() {
    return ArrayOptFirstElem(XQuery("for $elem in group_collaborators \n\
        where $elem/group_id = " + ASPIRE_GROUP + " \n\
        and $elem/collaborator_id = " + curUserID + " \n\
    return $elem")) == undefined ? false : true;
}

function isMyIPR() {
    return ArrayOptFirstElem(XQuery("for $elem in group_collaborators \n\
        where $elem/group_id = " + PERSONAL_IPR_GROUP + " \n\
        and $elem/collaborator_id = " + curUserID + " \n\
    return $elem")) == undefined ? false : true;
}

function isTeamIPR() {
    return ArrayOptFirstElem(XQuery("for $elem in group_collaborators \n\
        where $elem/group_id = " + TEAM_IPR_GROUP + " \n\
        and $elem/collaborator_id = " + curUserID + " \n\
    return $elem")) == undefined ? false : true;
}

function isCurUserInCompetence() {
    return ArrayOptFirstElem(XQuery("for $elem in pas \n\
        where $elem/assessment_appraise_id = "+ASSESSMENT_APPRAISE_ID+" \n\
        and $elem/person_id = " + curUserID + " \n\
        and $elem/assessment_appraise_type = 'competence_appraisal' \n\
    return $elem")) == undefined ? false : true;
}

function isCurUserInAssessment() {
    return ArrayOptFirstElem(XQuery("for $elem in group_collaborators \n\
        where $elem/group_id = " + GROUP_FOR_ASSESSMENT + " \n\
        and $elem/collaborator_id = " + curUserID + " \n\
    return $elem")) == undefined ? false : true;
}

function getAccess(person_id, boss_id, deputy_id, is_locked, step, year) {
    var boss = ( boss_id == curUserID || deputy_id == curUserID);
    var result = {
        canEdit: false, // Редактировать
        canClose: false, // Отменить цель
        canDelete: false, // Удалить цель
        canSetDeputy: false, // Установить заместителя
        canAcceptToBoss: false, // Направить на оценку руководителю
        canAcceptGoal: false, // Согласовать цель
        canReturnGoal: false, // Вернуть на доработку сотруднику
        canUserEvaluation: false, // Пройти самооценку
        canBossEvaluation: false, // Пройти оценку руководителя
        canGoToBossAssessmentFromFinish: false, // Руководитель c "Оценка завершена" на "Оценку руководителем"
        canGoToBossAsseessmentFromSelf: false, // Руководитель c "Самооценка" на "Оценку руководителем" 
        canViewBossResult: false
    }

    if (year != undefined && year != YEAR) {
        result.canViewBossResult = true;
    } else if (boss || SHOW_RESULT_USER) {
        result.canViewBossResult = true;
    }

    if (is_locked) {
        return result;
    }

    if ( boss_id == curUserID && deputy_id == null && step != "Оценка завершена" ) {
        result.canSetDeputy = true;
    }

    if (boss_id == curUserID && step == "Самооценка") {
        result.canGoToBossAsseessmentFromSelf = true;
    }

    if (boss_id == curUserID && step == "Оценка завершена") {
        result.canGoToBossAssessmentFromFinish = true;
    }

    if (step == "Черновик" && person_id == curUserID ) {
        result.canEdit = true;
        result.canDelete = true;
        result.canAcceptToBoss = true;
    } else if ( step == "Согласование руководителя" && boss ) {
        result.canAcceptGoal = true;
        result.canReturnGoal = true;
    } else if ( step == "Самооценка" && person_id == curUserID ) {
        result.canUserEvaluation = true;
        // result.canClose = true;
    } else if ( step == "Самооценка" && boss ) {
        result.canClose = true;
    } else if ( step == "Оценка руководителя" && boss ) {
        result.canBossEvaluation = true;
        result.canClose = true;
    }
    return result;
}

function getCompetenceAccess(person_id, bossCard, appraise_id) {
    var result = {
        plan_id: null,
        step: "",
        step_name: "",
        isCollaborator: false,
        isBoss: false,
        isDeputy: false,
        user_first_to_second: false,
        boss_second_to_first: false,
        boss_first_to_second: false,
        boss_second_to_third: false,
        boss_third_to_second: false,
        show_boss_result: SHOW_COMPETENCE_RESULT_USER,
        canUserEdit: false,
        canBossEdit: false
    };

    var findPlan = ArrayOptFirstElem(XQuery("for $elem in assessment_plans where \n\
        $elem/person_id = " + person_id + " \n\
        and $elem/assessment_appraise_id = " + appraise_id + " \n\
    return $elem"));

    if ( findPlan != undefined ) {
        planCard = tools.open_doc(findPlan.id)
        result.plan_id = Trim(findPlan.id);
        result.step = Trim(findPlan.workflow_state);
        result.step_name = Trim(planCard.TopElem.workflow_state_name);
    } else {
        return result;
    }

    var isCurUserDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_deputy_heads where \n\
        $elem/deputy_id = "+ curUserID + " and $elem/person_id = " + bossCard.TopElem.person_id + " \n\
    return $elem")) == undefined ? false : true;

    if ( isCurUserDeputy ) {
        result.isDeputy = true;
    }

    if ( curUserID == bossCard.TopElem.person_id ) {
        result.isCollaborator = true;
    }

    if ( curUserID == bossCard.TopElem.expert_person_id || isCurUserDeputy ) {
        result.isBoss = true;
    }

    if ( result.step == "firstStep" && result.isCollaborator && !ASSESSMENT_CLOSE ) {
        result.user_first_to_second = true;
        result.canUserEdit = true;
    }

    if ( result.step == "secondStep" && result.isBoss && !ASSESSMENT_CLOSE ) {
        result.boss_second_to_first = true;
        result.boss_second_to_third = true;
        result.canBossEdit = true;
    }

    if ( result.step == "firstStep" && result.isBoss && !ASSESSMENT_CLOSE ) {
        result.boss_first_to_second = true;
    }

    if ( result.step == "thirdStep" && result.isBoss && !ASSESSMENT_CLOSE ) {
        result.boss_third_to_second = true;
    }
    return result;
}

function getCompetenceDeputy(person_id) {
    var result = {
        id: null,
        fullname: ""
    }
    var findDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_deputy_heads \n\
        where $elem/person_id = " + person_id + " \n\
    return $elem"));

    if (findDeputy != undefined) {
        result.id = Trim(findDeputy.deputy_id);
        result.fullname = Trim(tools.open_doc(findDeputy.deputy_id).TopElem.fullname);
    }
    return result;
}

function getGoal(id) {
    var card = tools.open_doc(id);
    var cardTE = card.TopElem;

    try { start_date = StrMimeDate(cardTE.start_date) } catch(e) { start_date = "" };
    try { finish_date = StrMimeDate(cardTE.finish_date) } catch(e) { finish_date = "" };
    try { min = Trim(cardTE.min) } catch(e) { min = null };
    try { max = Trim(cardTE.max) } catch(e) { max = null };
    try { target = Trim(cardTE.target) } catch(e) { target = null };

    result = {
        id: Trim(cardTE.id),
        description: Trim(cardTE.description),
        title: Trim(cardTE.title),
        priority: Trim(cardTE.priority),
        start_date: start_date,
        finish_date: finish_date,
        deputy: getDeputy(cardTE.deputy_id),
        min: min,
        max: max,
        is_close: tools_web.is_true(cardTE.is_close),
        target: target,
        person_evaluation: Trim(cardTE.person_evaluation),
        person_comment: Trim(cardTE.person_comment),
        boss_comment: Trim(cardTE.boss_comment),
        boss_evaluation: Trim(cardTE.boss_evaluation),
        status: Trim(cardTE.status),
        access: getAccess(cardTE.person_id, cardTE.boss_id, cardTE.deputy_id, cardTE.is_close, cardTE.status)
    }
    return result;
}

// Вызывается с клиента для получения только списка целей
function get_CurUserGoals(queryObjects) {
    var year = queryObjects.HasProperty("year") ? OptInt(queryObjects.year, YEAR) : YEAR;

    var result = [];
    var findTotals = XQuery("sql: \n\
        declare @user_id bigint = "+curUserID+"; \n\
        SELECT \n\
            cmp.value('description[1]', 'varchar(max)') as description, \n\
            at.* \n\
        FROM \n\
            cc_hc_totals as at \n\
            inner join cc_hc_total as at_xml on at_xml.id = at.id \n\
            CROSS APPLY at_xml.data.nodes('cc_hc_total') as R(cmp) \n\
        WHERE \n\
            at.person_id = @user_id \n\
            and at.year = '"+year+"' \n\
    ");

    for (el in findTotals) {
        try { start_date = StrMimeDate(el.start_date) } catch(e) { start_date = "" };
        try { finish_date = StrMimeDate(el.finish_date) } catch(e) { finish_date = "" };
        try { min = Trim(el.min) } catch(e) { min = null };
        try { max = Trim(el.max) } catch(e) { max = null };
        try { target = Trim(el.target) } catch(e) { target = null };
        is_close = year == YEAR ? tools_web.is_true(el.is_close) : true

        result.push({
            id: Trim(el.id),
            description: Trim(el.description),
            title: Trim(el.title),
            priority: Trim(el.priority),
            start_date: start_date,
            finish_date: finish_date,
            is_close: is_close,
            deputy: getDeputy(el.deputy_id),
            min: min,
            max: max,
            person_evaluation: Trim(el.person_evaluation),
            person_comment: Trim(el.person_comment),
            boss_comment: Trim(el.boss_comment),
            boss_evaluation: Trim(el.boss_evaluation),
            target: target,
            status: Trim(el.status),
            access: getAccess(el.person_id, el.boss_id, el.deputy_id, is_close, el.status, year)
        })
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: result
    }, "json");
}

function get_UserGoals(queryObjects) {
    var user_id = queryObjects.HasProperty("user_id") ? OptInt(queryObjects.user_id, null) : null;
    var year = queryObjects.HasProperty("year") ? OptInt(queryObjects.year, YEAR) : YEAR;
    var result = [];
    var findTotals = XQuery("sql: \n\
        declare @user_id bigint = "+user_id+"; \n\
        declare @boss_id bigint = "+curUserID+"; \n\
        SELECT \n\
            cmp.value('description[1]', 'varchar(max)') as description, \n\
            at.* \n\
        FROM \n\
            cc_hc_totals as at \n\
            inner join cc_hc_total as at_xml on at_xml.id = at.id \n\
            CROSS APPLY at_xml.data.nodes('cc_hc_total') as R(cmp) \n\
        WHERE \n\
            at.person_id = @user_id \n\
            and (at.boss_id = @boss_id or at.deputy_id = @boss_id) \n\
            and at.year = '"+year+"' \n\
            and at.status <> 'Черновик' \n\
            and at.is_close <> 1 \n\
            and at.global_locked <> 1 \n\
    ");

    for (el in findTotals) {
        try { start_date = StrMimeDate(el.start_date) } catch(e) { start_date = "" };
        try { finish_date = StrMimeDate(el.finish_date) } catch(e) { finish_date = "" };
        try { min = Trim(el.min) } catch(e) { min = null };
        try { max = Trim(el.max) } catch(e) { max = null };
        try { target = Trim(el.target) } catch(e) { target = null };
        is_close = year == YEAR ? tools_web.is_true(el.is_close) : true;
        
        result.push({
            id: Trim(el.id),
            description: Trim(el.description),
            title: Trim(el.title),
            priority: Trim(el.priority),
            start_date: start_date,
            finish_date: finish_date,
            is_close: is_close,
            deputy: getDeputy(el.deputy_id),
            min: min,
            max: max,
            target: target,
            person_evaluation: Trim(el.person_evaluation),
            person_comment: Trim(el.person_comment),
            boss_comment: Trim(el.boss_comment),
            boss_evaluation: Trim(el.boss_evaluation),
            status: Trim(el.status),
            access: getAccess(el.person_id, el.boss_id, el.deputy_id, is_close, el.status, year)
        })
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: result
    }, "json");
}

function getGoals(user_id, year) {
    var selected_year = year == undefined ? YEAR : year;
    var result = [];
    var findTotals = XQuery("sql: \n\
        declare @user_id bigint = "+user_id+"; \n\
        declare @boss_id bigint = "+curUserID+"; \n\
        SELECT \n\
            cmp.value('description[1]', 'varchar(max)') as description, \n\
            at.* \n\
        FROM \n\
            cc_hc_totals as at \n\
            inner join cc_hc_total as at_xml on at_xml.id = at.id \n\
            CROSS APPLY at_xml.data.nodes('cc_hc_total') as R(cmp) \n\
        WHERE \n\
            at.person_id = @user_id \n\
            and (at.boss_id = @boss_id or at.deputy_id = @boss_id) \n\
            and at.year = '"+selected_year+"' \n\
            and at.status <> 'Черновик' \n\
            and at.is_close <> 1 \n\
            and at.global_locked <> 1 \n\
    ");

    for (el in findTotals) {
        try { start_date = StrMimeDate(el.start_date) } catch(e) { start_date = "" };
        try { finish_date = StrMimeDate(el.finish_date) } catch(e) { finish_date = "" };
        try { min = Trim(el.min) } catch(e) { min = null };
        try { max = Trim(el.max) } catch(e) { max = null };
        try { target = Trim(el.target) } catch(e) { target = null };
        
        result.push({
            id: Trim(el.id),
            description: Trim(el.description),
            title: Trim(el.title),
            priority: Trim(el.priority),
            start_date: start_date,
            finish_date: finish_date,
            is_close: tools_web.is_true(el.is_close),
            deputy: getDeputy(el.deputy_id),
            min: min,
            max: max,
            target: target,
            person_evaluation: Trim(el.person_evaluation),
            person_comment: Trim(el.person_comment),
            boss_comment: Trim(el.boss_comment),
            boss_evaluation: Trim(el.boss_evaluation),
            status: Trim(el.status),
            access: getAccess(el.person_id, el.boss_id, el.deputy_id, el.is_close, el.status)
        })
    }
    return result;
}

function getCurUserGoals(user_id) {
    var result = [];
    var findTotals = XQuery("sql: \n\
        declare @user_id bigint = "+user_id+"; \n\
        SELECT \n\
            cmp.value('description[1]', 'varchar(max)') as description, \n\
            at.* \n\
        FROM \n\
            cc_hc_totals as at \n\
            inner join cc_hc_total as at_xml on at_xml.id = at.id \n\
            CROSS APPLY at_xml.data.nodes('cc_hc_total') as R(cmp) \n\
        WHERE \n\
            at.person_id = @user_id \n\
            and at.year = '"+YEAR+"' \n\
    ");

    for (el in findTotals) {
        try { start_date = StrMimeDate(el.start_date) } catch(e) { start_date = "" };
        try { finish_date = StrMimeDate(el.finish_date) } catch(e) { finish_date = "" };
        try { min = Trim(el.min) } catch(e) { min = null };
        try { max = Trim(el.max) } catch(e) { max = null };
        try { target = Trim(el.target) } catch(e) { target = null };
        
        result.push({
            id: Trim(el.id),
            description: Trim(el.description),
            title: Trim(el.title),
            priority: Trim(el.priority),
            start_date: start_date,
            finish_date: finish_date,
            is_close: tools_web.is_true(el.is_close),
            deputy: getDeputy(el.deputy_id),
            min: min,
            max: max,
            person_evaluation: Trim(el.person_evaluation),
            person_comment: Trim(el.person_comment),
            boss_comment: Trim(el.boss_comment),
            boss_evaluation: Trim(el.boss_evaluation),
            target: target,
            status: Trim(el.status),
            access: getAccess(el.person_id, el.boss_id, el.deputy_id, el.is_close, el.status)
        })
    }
    return result;
}

function getManager(id) {
    var result = {
        id: null,
        fullname: ""
    }

    var findManager = ArrayOptFirstElem(XQuery("for $elem in func_managers where \n\
        $elem/object_id = " + id + " \n\
        and $elem/catalog = 'collaborator' \n\
        and $elem/boss_type_id = " + MAIN_BOSS_TYPE_ID + " \n\
    return $elem"))

    if (findManager != undefined) {
        result.id = Trim(findManager.person_id);
        result.fullname = Trim(findManager.person_fullname);
    }
    return result;
}

function getAvatar(userCard) {
    if ( StrContains(userCard.pict_url, '/download_file.html?file_id=') == true ) {
        return Trim(IMG_BASE_URL + userCard.pict_url)
    } 
    return IMG_BASE_URL + '/download_file.html?file_id=' + NO_AVATAR_ID;
}

function get_Competence(queryObjects) {
    function _isCompetenceRequired(user_id, competenceCard) {
        var checkInGroup = ArrayOptFirstElem(XQuery("for $elem in group_collaborators \n\
            where $elem/group_id = " + ALL_COMPETENCE + " \n\
            and $elem/collaborator_id = " + user_id + " \n\
        return $elem")) == undefined ? false : true;

        var userRequired = tools_web.is_true(competenceCard.TopElem.custom_elems.ObtainChildByKey("mandatory_competence_employee").value);

        // если оцениваемый в группе то все компетенции обязательные
        if (checkInGroup) {
            return true;
        } else if ( userRequired ) {
            return true;
        }
        return false;
    }

    var person_id = queryObjects.HasProperty("person_id") ? OptInt(queryObjects.person_id, curUserID) : curUserID;
    var appraise_id = queryObjects.HasProperty("appraise_id") ? OptInt(queryObjects.appraise_id, ASSESSMENT_APPRAISE_ID) : ASSESSMENT_APPRAISE_ID;
    var result = {
        is_new_type: true, // Формат отрисовки компетенций
        show_control_buttons: false, // Показывать кнопки в компетенциях
        user_card_id: null,
        boss_card_id: null,
        access: null,
        leader: {
            new_header: [
                {
                    id: "head_0",
                    title: "",
                },
                {
                    id: "head_1",
                    title: "Комментарий сотрудника",
                },
                {
                    id: "head_2",
                    title: "Комментарий руководителя",
                },
                {
                    id: "head_3",
                    title: "Оценка руководителя",
                },
            ],
            old_header: [
                {
                    id: "head_0",
                    title: "",
                },
                {
                    id: "head_1",
                    title: "Оценка сотрудника",
                },
                {
                    id: "head_2",
                    title: "Оценка руководителя",
                },
                {
                    id: "head_3",
                    title: "Комментарий руководителя",
                },
            ],
            items: []
        },
        func: {
            user_comment: "",
            boss_comment: ""
        },
        totals: {
            user_comment: "",
            boss_comment: "",
            main_point: "",
            point_list: [
                {
                  value: "Потрясающе",
                  number: "5",
                  label: "5 - Потрясающе",
                  boss_text:
                    "Потрясающе, ты - образец для подражания! Результативность/проявление компетенций представляют собой исключительный уровень достижений. Эта оценка означает выдающийся вклад сотрудника. Уместно обсудить карьерное развитие сотрудника. Такие достижения обязательно следует признать и отметить.",
                  user_text:
                    "Потрясающе, ты - образец для подражания! Результативность/проявление компетенций представляют собой исключительный уровень достижений.",
                },
                {
                  value: "Выше ожиданий",
                  label: "4 - Выше ожиданий",
                  number: "4",
                  user_text:
                    "Молодец! Результативность/проявление компетенций превышали установленные стандарты и договоренности.",
                  boss_text:
                    "Молодец! Результативность/проявление компетенций превышали установленные стандарты и договоренности. Если сотрудник часто получает эту оценку, следует обсудить с ним расширение полномочий или новую роль.",
                },
                {
                  value: "Соответствует ожиданиям",
                  number: "3",
                  label: "3 - Соответствует ожиданиям",
                  user_text:
                    "Хорошая работа! Результативность/проявление компетенций оправдали ожидания с точки зрения качества и сроков. Ключевые цели, должностные обязанности и другие требования были полностью выполнены.",
                  boss_text:
                    "Хорошая работа! Результативность/проявление компетенций оправдали ожидания с точки зрения качества и сроков. Ключевые цели, должностные обязанности и другие требования были полностью выполнены.",
                },
                {
                  value: "Ниже ожиданий",
                  number: "2",
                  label: "2 - Ниже ожиданий",
                  boss_text:
                    "Тебе нужно развиваться, сохранять фокус. Результативность/проявление компетенций (пока) не соответствуют ожиданиям. Эта оценка прямо показывает, что не все так, как ожидалось. Попытки улучшить ситуацию крайне необходимы. Через 6 месяцев обязательна повторная оценка.",
                  user_text:
                    "Тебе нужно развиваться, сохранять фокус. Результативность/проявление компетенций (пока) не соответствуют ожиданиям.",
                },
                {
                  value: "Не соответствует ожиданиям",
                  number: "1",
                  label: "1 - Не соответствует ожиданиям",
                  boss_text:
                    "Результативность/проявление компетенций были значительно ниже ожиданий. Дальнейшие действия должны быть четко определены и согласованы, например, перевод на другую роль, увольнение и т. д.",
                  user_text:
                    "Результативность/проявление компетенций были значительно ниже ожиданий.",
                }
            ]
        }
    }

    var findUserPa = ArrayOptFirstElem(XQuery("for $elem in pas where \n\
        $elem/person_id = " + person_id + " \n\
        and $elem/assessment_appraise_id = " + appraise_id + " \n\
        and $elem/assessment_appraise_type = 'competence_appraisal' \n\
        and $elem/status = 'self' \n\
    return $elem"));
    
    var findBossPa = ArrayOptFirstElem(XQuery("for $elem in pas where \n\
        $elem/person_id = " + person_id + " \n\
        and $elem/assessment_appraise_id = " + appraise_id + " \n\
        and $elem/assessment_appraise_type = 'competence_appraisal' \n\
        and $elem/status = 'manager' \n\
    return $elem"));

    var findPlan = ArrayOptFirstElem(XQuery("for $elem in assessment_plans where \n\
        $elem/person_id = " + person_id + " \n\
        and $elem/assessment_appraise_id = " + appraise_id + " \n\
    return $elem"));

    if ( findUserPa == undefined || findBossPa == undefined || findPlan == undefined) {
        return tools.object_to_text({
            type: "error",
            message: "Анкеты или план отсутствуют",
            data: null
        }, "json");
    }
    result.is_new_type = ArrayOptFirstElem(XQuery("for $elem in assessment_appraises where \n\
        $elem/id = " + appraise_id + " \n\
        and doc-contains($elem/id,'wt_data','[is_old!=true~bool]') \n\
    return $elem")) == undefined ? false : true;

    result.show_control_buttons = appraise_id == ASSESSMENT_APPRAISE_ID ? true : false;

    result.user_card_id = Trim(findUserPa.id);
    result.boss_card_id = Trim(findBossPa.id);

    userPaCard = tools.open_doc(findUserPa.id);
    bossPaCard = tools.open_doc(findBossPa.id);
    result.access = getCompetenceAccess(person_id, bossPaCard, appraise_id);

    result.totals.user_comment = Trim(userPaCard.TopElem.custom_elems.ObtainChildByKey("user_comment").value);
    result.totals.boss_comment = Trim(bossPaCard.TopElem.custom_elems.ObtainChildByKey("boss_comment").value);
    result.totals.main_point = Trim(bossPaCard.TopElem.custom_elems.ObtainChildByKey("main_point").value);
    result.func.user_comment = Trim(userPaCard.TopElem.custom_elems.ObtainChildByKey("user_func_comment").value);
    result.func.boss_comment = Trim(bossPaCard.TopElem.custom_elems.ObtainChildByKey("boss_func_comment").value);

    for (el in bossPaCard.TopElem.competences) {
        // Найдем аналогичные данные по сотруднику
        compCard = tools.open_doc(el.competence_id);
        findComp = ArrayOptFind(userPaCard.TopElem.competences, "This.competence_id == " + el.competence_id);
        if ( findComp != undefined ) {
            scales = [];
            for (scal in compCard.TopElem.scales) {
                scales.push({
                    key: Trim(scal.id),
                    label: Trim(scal.name),
                    desc: Trim(scal.desc)
                })
            }
            result.leader.items.push({
                id: Trim(el.competence_id),
                positive_comment: Trim(compCard.TopElem.positive_comment),
                title: Trim(compCard.TopElem.name),
                user_comment: Trim(findComp.comment),
                boss_comment: Trim(el.comment),
                user_mark: Trim(findComp.mark),
                boss_mark: Trim(el.mark),
                is_required: _isCompetenceRequired(person_id, compCard),
                scales: scales,
            })
        }
    }
 
    return tools.object_to_text({
        type: "success",
        message: "",
        data: result
    }, "json");
}

function get_BaseData() {
    var find_cat = tools.open_doc(curUserID).TopElem.custom_elems.GetOptChildByKey('f_ng1k')
    var category = find_cat == undefined ? "" : find_cat.value;
    var result = {
        curUser: {
            id: Trim(curUser.id),
            lastname: Trim(curUser.lastname),
            firstname: Trim(curUser.firstname),
            middlename: Trim(curUser.middlename),
            position_name: Trim(curUser.position_name),
            position_parent_name: Trim(curUser.position_parent_name),
            code: Trim(curUser.code),
            category: Trim(category),
            boss_fullname: getManager(curUserID).fullname,
            deputy_fullname: getCompetenceDeputy(curUserID).fullname,
            avatar: getAvatar(curUser),
            goals: getCurUserGoals(curUserID),
            competence: {
                user_card_id: "",
                boss_card_id: "",
                leader: {
                    header: [
                        {
                            id: "head_0",
                            title: "",
                        },
                        {
                            id: "head_1",
                            title: "Комментарий сотрудника",
                        },
                        {
                            id: "head_2",
                            title: "Комментарий руководителя",
                        },
                        {
                            id: "head_3",
                            title: "Оценка руководителя",
                        },
                    ]
                },
                func: {
                    user_comment: "",
                    boss_comment: ""
                },
                totals: {
                    user_comment: "",
                    boss_comment: "",
                    final_grade: "",
                    point_list: [
                        {
                          value: "Потрясающе",
                          label: "5 - Потрясающе",
                          boss_text:
                            "Потрясающе, ты - образец для подражания! Результативность/проявление компетенций представляют собой исключительный уровень достижений. Эта оценка означает выдающийся вклад сотрудника. Уместно обсудить карьерное развитие сотрудника. Такие достижения обязательно следует признать и отметить.",
                          user_text:
                            "Потрясающе, ты - образец для подражания! Результативность/проявление компетенций представляют собой исключительный уровень достижений.",
                        },
                        {
                          value: "Выше ожиданий",
                          label: "4 - Выше ожиданий",
                          user_text:
                            "Молодец! Результативность/проявление компетенций превышали установленные стандарты и договоренности.",
                          boss_text:
                            "Молодец! Результативность/проявление компетенций превышали установленные стандарты и договоренности. Если сотрудник часто получает эту оценку, следует обсудить с ним расширение полномочий или новую роль.",
                        },
                        {
                          value: "Соответствует ожиданиям",
                          label: "3 - Соответствует ожиданиям",
                          user_text:
                            "Хорошая работа! Результативность/проявление компетенций оправдали ожидания с точки зрения качества и сроков. Ключевые цели, должностные обязанности и другие требования были полностью выполнены.",
                          boss_text:
                            "Хорошая работа! Результативность/проявление компетенций оправдали ожидания с точки зрения качества и сроков. Ключевые цели, должностные обязанности и другие требования были полностью выполнены.",
                        },
                        {
                          value: "Ниже ожиданий",
                          label: "2 - Ниже ожиданий",
                          boss_text:
                            "Тебе нужно развиваться, сохранять фокус. Результативность/проявление компетенций (пока) не соответствуют ожиданиям. Эта оценка прямо показывает, что не все так, как ожидалось. Попытки улучшить ситуацию крайне необходимы. Через 6 месяцев обязательна повторная оценка.",
                          user_text:
                            "Тебе нужно развиваться, сохранять фокус. Результативность/проявление компетенций (пока) не соответствуют ожиданиям.",
                        },
                        {
                          value: "Не соответствует ожиданиям",
                          label: "1 - Не соответствует ожиданиям",
                          boss_text:
                            "Результативность/проявление компетенций были значительно ниже ожиданий. Дальнейшие действия должны быть четко определены и согласованы, например, перевод на другую роль, увольнение и т. д.",
                          user_text:
                            "Результативность/проявление компетенций были значительно ниже ожиданий.",
                        }
                    ]
                }
            },
            history: {
                total: getHistory(curUserID, "total"),
                competence: getHistory(curUserID)
            }
        },
        navigation: {
            isMyIPR: isMyIPR(),
            isTeamIPR: isTeamIPR(),
            isAspire: isUserInAspire(),
            isCurUserInCompetence: isCurUserInCompetence(),
            isCurUserInAssessment: isCurUserInAssessment(), // проверить что состоит в группе
            isCurUserBoss: isCurUserBoss(), // проверить что есть подчинненный который остоит в группе
            isCurUserNoob: isCurUserNoob(), // проверить что сотрудник не новичек
            cur_assessment: Trim(ASSESSMENT_APPRAISE_ID),
            year: YEAR
        }
    };
    
	return tools.object_to_text({
        type: "success",
        message: "",
        data: result
    }, "json");
}

function get_User(queryObjects) {
    var user_id = queryObjects.HasProperty("user_id") ? OptInt(queryObjects.user_id, null) : null;
    var userCard = tools.open_doc(user_id).TopElem;
    var category = userCard.custom_elems.GetOptChildByKey('f_ng1k') == undefined ? "" : userCard.custom_elems.GetOptChildByKey('f_ng1k').value;
    var result = {
        id: Trim(user_id),
        lastname: Trim(userCard.lastname),
        firstname: Trim(userCard.firstname),
        middlename: Trim(userCard.middlename),
        position_name: Trim(userCard.position_name),
        position_parent_name: Trim(userCard.position_parent_name),
        code: Trim(userCard.code),
        category: Trim(category),
        boss_fullname: getManager(user_id).fullname,
        deputy_fullname: getCompetenceDeputy(user_id).fullname,
        avatar: getAvatar(userCard),
        goals: getGoals(user_id),
        history: {
            total: getHistory(user_id, "total"),
            competence: getHistory(user_id)
        }
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: result
    }, "json");
}

// Удаление заместителя в компетенциях
function get_RemoveDeputy(queryObjects) { 
    var user_id = queryObjects.HasProperty("person_id") ? OptInt(queryObjects.person_id, null) : null;
    var type = queryObjects.HasProperty("type") ? Trim(queryObjects.type) : null;
    var findDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_deputy_heads \n\
        where $elem/person_id = " + user_id + " \n\
    return $elem"));
    
    if (findDeputy != undefined) {
        var bossFullname = tools.open_doc(findDeputy.boss_id).TopElem.fullname;
        var deputy_id = OptInt(findDeputy.deputy_id, null);
        DeleteDoc(UrlFromDocID(findDeputy.id));
        if (ACTIVATE_NOTIFICATION) {
            // Отмена заместителя (отправка уведомления заместителю)
            tools.create_notification('HC2_deputy_dep_cancel', deputy_id, bossFullname, user_id );
            // Отмена заместителя (отправка уведомления сотруднику)
            tools.create_notification('HC2_deputy_coll_cancel', user_id, bossFullname, deputy_id );
        }
    }
    if (type != null) {
        return get_Team({});
    }
    return get_User({user_id: user_id});
}

// Удаление заместителя в компетенциях (Команда)
function get_RemoveDeputyCompetence(queryObjects) { 
    var user_id = queryObjects.HasProperty("person_id") ? OptInt(queryObjects.person_id, null) : null;
    var findDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_deputy_heads \n\
        where $elem/person_id = " + user_id + " \n\
    return $elem"));
    
    if (findDeputy != undefined) {
        var bossFullname = tools.open_doc(findDeputy.boss_id).TopElem.fullname;
        var deputy_id = OptInt(findDeputy.deputy_id, null);
        DeleteDoc(UrlFromDocID(findDeputy.id));
        if (ACTIVATE_NOTIFICATION) {
            // Отмена заместителя (отправка уведомления заместителю)
            tools.create_notification('HC2_deputy_dep_cancel', deputy_id, bossFullname, user_id );
            // Отмена заместителя (отправка уведомления сотруднику)
            tools.create_notification('HC2_deputy_coll_cancel', user_id, bossFullname, deputy_id );
        }
    }
    return get_Team({});
}

// Установка заместителя в компетенциях
function post_SaveCompetenceDeputy(queryObjects) {
    var data = tools.read_object(queryObjects.Body);
    var deputy_id = data.HasProperty('deputy_id') ? OptInt(data.deputy_id, null) : null;
    var person_id = data.HasProperty('person_id') ? OptInt(data.person_id, null) : null;
    var deputyCardID = null;
    try {
        var set_date = data.HasProperty('date') ? DateOffset(Date(data.date), 10800) : null; 
    } catch(e) {
        set_date = null;
    }

    var findDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_deputy_heads \n\
        where $elem/boss_id = " + curUserID + " \n\
        and $elem/person_id = " + person_id + " \n\
    return $elem"));

    if (findDeputy == undefined) {
        newDoc = tools.new_doc_by_name('cc_deputy_head');
        newDoc.TopElem.date = set_date;
        newDoc.TopElem.deputy_id = deputy_id;
        newDoc.TopElem.boss_id = curUserID;
        newDoc.TopElem.person_id = person_id;
        newDoc.BindToDb(DefaultDb);
        newDoc.Save();
        deputyCardID = newDoc.DocID;
    } else {
        deputyCardID = findDeputy.id;
        doc = OpenDoc(UrlFromDocID(findDeputy.id))
        doc.TopElem.date = set_date;
        doc.TopElem.deputy_id = deputy_id;
        doc.TopElem.boss_id = curUserID;
        doc.TopElem.person_id = person_id;
        doc.Save();
    }

    if (ACTIVATE_NOTIFICATION) {
        // Установка заместителя (отправка уведомления заместителю)
        tools.create_notification('HC2_deputy_dep', deputy_id, "", deputyCardID);
        // Установка заместителя (отправка уведомления сотруднику)
        tools.create_notification('HC2_deputy_coll', person_id,"", deputyCardID);
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: null
    }, "json");
}

// Установка заместителя в компетенциях или целях - Команда
function post_SaveDeputys() {
    var data = tools.read_object(queryObjects.Body);
    var deputy_id = data.HasProperty('deputy_id') ? OptInt(data.deputy_id, null) : null;
    var is_competence = data.HasProperty('is_competence') ? tools_web.is_true(data.is_competence) : false;
    var is_total = data.HasProperty('is_total') ? tools_web.is_true(data.is_total) : false;
    try {
        var set_date = data.HasProperty('date') ? DateOffset(Date(data.date), 10800) : null; 
    } catch(e) {
        set_date = null;
    }
    var users = data.HasProperty('users') ? data.users : [];
    var deputyCardID = null;

    for (el in users) {
        if (is_competence) {
            findDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_deputy_heads \n\
                where $elem/boss_id = " + curUserID + " \n\
                and $elem/person_id = " + el.id + " \n\
            return $elem"));
            if (findDeputy == undefined) {
                newDoc = tools.new_doc_by_name('cc_deputy_head');
                newDoc.TopElem.date = set_date;
                newDoc.TopElem.deputy_id = deputy_id;
                newDoc.TopElem.boss_id = curUserID;
                newDoc.TopElem.person_id = el.id;
                newDoc.BindToDb(DefaultDb);
                newDoc.Save();
                deputyCardID = newDoc.DocID;
            } else {
                deputyCardID = findDeputy.id;
                doc = OpenDoc(UrlFromDocID(findDeputy.id))
                doc.TopElem.date = set_date;
                doc.TopElem.deputy_id = deputy_id;
                doc.TopElem.boss_id = curUserID;
                doc.TopElem.person_id = el.id;
                doc.Save();
            }
            if (ACTIVATE_NOTIFICATION) {
                // Установка заместителя (отправка уведомления заместителю)
                tools.create_notification('HC2_deputy_dep', deputy_id, "", deputyCardID);
                // Установка заместителя (отправка уведомления сотруднику)
                tools.create_notification('HC2_deputy_coll', el.id,"", deputyCardID);
            }
        }
        if ( is_total ) {
            findGoals = XQuery("for $elem in cc_hc_totals where $elem/person_id = "+el.id+" and $elem/year = "+YEAR+" return $elem");
            for (_item in findGoals) {
                card = tools.open_doc(_item.id);
                card.TopElem.deputy_id = deputy_id;
                card.Save();

                if (ACTIVATE_NOTIFICATION) {
                    // Установка заместителя (отправка уведомления заместителю)
                    tools.create_notification('HC_G_bossToDep_depSet', deputy_id, "", _item.id);
                    // Установка заместителя (отправка уведомления сотруднику)
                    tools.create_notification('HC_G_bossToColl_depSet', deputy_id, "", _item.id);
                }
            }
        }
    }

    return get_Team({});
}

function post_SaveGoal(queryObjects) {
    var data = tools.read_object(queryObjects.Body);
    var id = data.HasProperty("id") ? OptInt(data.id, null) : null;
    var title = data.HasProperty("title") ? Trim(data.title) : "";
    var description = data.HasProperty("description") ? Trim(data.description) : "";
    var priority = data.HasProperty("priority") ? Trim(data.priority) : "Средний";
    var who_create = data.HasProperty("who_create") ? Trim(data.who_create) : "user";
    var user_id = data.HasProperty("user_id") ? OptInt(data.user_id, curUserID) : curUserID;
    try {
        var start_date = data.HasProperty("start_date") ? DateOffset(Date(data.start_date), 10800) : null;
    } catch(e) {
        start_date = null;
    }
    try {
        var finish_date = data.HasProperty("finish_date") ? DateOffset(Date(data.finish_date), 10800) : null;
    } catch(e) {
        finish_date = null;
    }
    
    try {
        var min = data.HasProperty("min") ? Real(data.min) : "";
    } catch(e) {
        min = "";
    }

    try {
        var max = data.HasProperty("max") ? Real(data.max) : "";
    } catch(e) {
        max = "";
    }

    try {
        var target = data.HasProperty("target") ? Real(data.target) : "";
    } catch(e) {
        target = "";
    }

    var goal_status = who_create == 'boss' ? "Самооценка" : "Черновик";
    var boss_id = who_create == 'boss' ? curUserID : getManager(user_id).id; 
    

    if (id == null ) {
        newDoc = tools.new_doc_by_name('cc_hc_total');
        newDoc.TopElem.status = goal_status;
        newDoc.BindToDb(DefaultDb);                
    } else {
        newDoc = tools.open_doc(id);
    }
    newDoc.TopElem.title = title;
    newDoc.TopElem.description = description;
    newDoc.TopElem.priority = priority;
    newDoc.TopElem.person_id = user_id;
    newDoc.TopElem.start_date = start_date;
    newDoc.TopElem.finish_date = finish_date;
    newDoc.TopElem.boss_id = boss_id;
    newDoc.TopElem.year = YEAR;
    newDoc.TopElem.min = min;
    newDoc.TopElem.max = max;
    newDoc.TopElem.target = target;
    newDoc.Save();

    var result_data = who_create == 'boss' ? getGoals(user_id) : getCurUserGoals(user_id);

    return tools.object_to_text({
        type: "success",
        message: "",
        data: result_data
    }, "json");
}

function get_DeleteGoal() {
    var goal_id = queryObjects.HasProperty("id") ? OptInt(queryObjects.id, null) : null;
    DeleteDoc(UrlFromDocID(goal_id));

    return tools.object_to_text({
        type: "success",
        message: "",
        data: getCurUserGoals(curUserID)
    }, "json");
}
// Полученение списка команды
function get_Team(queryObjects) {
    var result = [];
    var search = queryObjects.HasProperty("search") ? Trim(queryObjects.search) : null;
    var statusId = queryObjects.HasProperty("status_id") ? Trim(queryObjects.status_id) : null;
    statusId = statusId == '' ? null : statusId;
    var IMG_URL = IMG_BASE_URL + '/download_file.html?file_id=' + NO_AVATAR_ID;
    var findTeams = XQuery("sql: \n\
        declare @boss_id bigint = "+curUserID+"; \n\
        declare @selected_year nvarchar(200) = '" + YEAR + "'; \n\
        declare @group_id bigint = "+GROUP_FOR_ASSESSMENT+"; \n\
        declare @boss_type_id bigint = "+MAIN_BOSS_TYPE_ID+"; \n\
        declare @no_avatar varchar(max) = '"+IMG_URL+"'; \n\
        declare @assessment_appraise_id bigint = "+ASSESSMENT_APPRAISE_ID+"; \n\
        declare @search nvarchar(200) = '" + (search == null ? '' : search) + "'; \n\
        declare @status_id nvarchar(200) = '" + (statusId == null ? '' : statusId) + "'; \n\
        SELECT \n\
        * \n\
        FROM ( \n\
            SELECT \n\
                cols.id, \n\
                cols.fullname as fullname, \n\
                cols.position_name as position_name, \n\
                isNULL(cols.pict_url, @no_avatar) as avatar, \n\
                (SELECT cct.deputy_id FROM cc_deputy_heads as cct where cct.person_id = cols.id and cct.boss_id = @boss_id) as deputy_id, \n\
                (SELECT COUNT(*) from cc_hc_totals as cc where cc.person_id = cols.id and cc.status <> 'Черновик' and cc.is_close <> 1 and cc.global_locked <> 1 and cc.year = @selected_year ) as goals_count, \n\
                ( \n\
                    SELECT \n\
                        case COUNT(ap.id) \n\
                            when 0 then 0 \n\
                            else 1 \n\
                        end result \n\
                    FROM \n\
                        assessment_plans as ap \n\
                    WHERE \n\
                    ap.person_id = cols.id \n\
                    and ap.assessment_appraise_id = @assessment_appraise_id \n\
                    and (ap.workflow_state = @status_id or @status_id = '') \n\
                ) as show_competence, \n\
                ( \n\
                    SELECT \n\
                        case COUNT(gc.id) \n\
                            when 0 then 0 \n\
                            else 1 \n\
                        end result \n\
                    FROM \n\
                        group_collaborators as gc \n\
                    WHERE \n\
                        gc.collaborator_id = cols.id \n\
                        and gc.group_id = @group_id \n\
                ) as show_total \n\
                FROM \n\
                    func_managers as fm \n\
                    inner join collaborators as cols on cols.id = fm.object_id \n\
                WHERE \n\
                    fm.person_id = @boss_id \n\
                    and fm.boss_type_id = @boss_type_id \n\
                    and cols.is_dismiss <> '1' \n\
                    and cols.fullname like '%'+@search+'%' \n\
            ) as temp \n\
        WHERE \n\
            (temp.show_competence = 1 or temp.show_total = 1 ) \n\
    ");

    var findDeputyTeams = XQuery("sql: \n\
        declare @boss_id bigint = "+curUserID+"; \n\
        declare @group_id bigint = "+GROUP_FOR_ASSESSMENT+"; \n\
        declare @boss_type_id bigint = "+MAIN_BOSS_TYPE_ID+"; \n\
        declare @no_avatar varchar(max) = '"+IMG_URL+"'; \n\
        declare @assessment_appraise_id bigint = "+ASSESSMENT_APPRAISE_ID+"; \n\
        declare @search nvarchar(200) = '" + (search == null ? '' : search) + "'; \n\
        declare @status_id nvarchar(200) = '" + (statusId == null ? '' : statusId) + "'; \n\
        SELECT \n\
        * \n\
        FROM ( \n\
            SELECT \n\
                cols.id, \n\
                cols.fullname as fullname, \n\
                cols.position_name as position_name, \n\
                isNULL(cols.pict_url, @no_avatar) as avatar, \n\
                (SELECT COUNT(*) from cc_hc_totals as cc where cc.person_id = cols.id and cc.deputy_id = @boss_id and cc.status <> 'Черновик' ) as goals_count, \n\
                ( \n\
                    SELECT \n\
                        case COUNT(ap.id) \n\
                            when 0 then 0 \n\
                            else 1 \n\
                        end result \n\
                    FROM \n\
                        assessment_plans as ap \n\
                    WHERE \n\
                    ap.person_id = cols.id \n\
                    and ap.assessment_appraise_id = @assessment_appraise_id \n\
                    and (ap.workflow_state = @status_id or @status_id = '') \n\
                    and (SELECT COUNT(dh.person_id) FROM cc_deputy_heads dh WHERE dh.deputy_id = @boss_id) > 0 \n\
                ) as show_competence, \n\
                ( \n\
                    SELECT \n\
                        case COUNT(gc.id) \n\
                            when 0 then 0 \n\
                            else 1 \n\
                        end result \n\
                    FROM \n\
                        group_collaborators as gc \n\
                    WHERE \n\
                        gc.collaborator_id = cols.id \n\
                        and gc.group_id = @group_id \n\
                        and (SELECT COUNT(cc.person_id) FROM cc_hc_totals cc WHERE cc.deputy_id = @boss_id) > 0 \n\
                ) as show_total \n\
            FROM \n\
                ( \n\
                    SELECT dh.person_id FROM cc_deputy_heads dh WHERE dh.deputy_id = @boss_id \n\
                    UNION \n\
                    SELECT cc.person_id FROM cc_hc_totals cc WHERE cc.deputy_id = @boss_id \n\
                ) as ss \n\
                INNER JOIN collaborators as cols on cols.id = ss.person_id \n\
            WHERE \n\
                cols.is_dismiss <> '1' \n\
                and cols.fullname like '%'+@search+'%' \n\
            ) as temp \n\
        WHERE \n\
            (temp.show_competence = 1 or temp.show_total = 1 ) \n\
    ");

    for (el in findTeams) {
        if (statusId != null && !tools_web.is_true(el.show_competence) ) {
            continue;
        }
        result.push({
            id: Trim(el.id),
            fullname: Trim(el.fullname),
            deputy_id: getDeputy(el.deputy_id).id,
            deputy_fullname: getDeputy(el.deputy_id).fullname,
            avatar: Trim(el.avatar),
            goals_count: Trim(el.goals_count),
            showTotal: tools_web.is_true(el.show_total),
            showCompetence: tools_web.is_true(el.show_competence),
            competences: getCurAssessmentCompetence(el.id),
            selected: false,
            is_deputy: false
        })
    }

    for (el in findDeputyTeams) {
        if (statusId != null && !tools_web.is_true(el.show_competence) ) {
            continue;
        }
        result.push({
            id: Trim(el.id),
            fullname: Trim(el.fullname),
            position_name: Trim(el.position_name),
            deputy_id: null,
            deputy_fullname: "",
            avatar: Trim(el.avatar),
            goals_count: Trim(el.goals_count),
            showTotal: tools_web.is_true(el.show_total),
            showCompetence: tools_web.is_true(el.show_competence),
            competences: getCurAssessmentCompetence(el.id),
            selected: false,
            is_deputy: true
        })
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: ArraySort( result, 'This.showCompetence', '-' )
    }, "json");
}
// Переходы в целях
function get_SetStatus(queryObjects) {
    var id = queryObjects.HasProperty("id") ? OptInt(queryObjects.id, null) : null;
    var status = queryObjects.HasProperty("status") ? Trim(queryObjects.status) : "";
    var newStatus = Trim(status);
    var oldStatus = "";
    if ( status != "" && id != null ) {
        var card = tools.open_doc(id);
        oldStatus = Trim(card.TopElem.status);
        card.TopElem.status = status;
        card.Save();

        if (ACTIVATE_NOTIFICATION) {
            if (oldStatus == "Черновик" && newStatus == "Согласование руководителя") {
                // Отправка цели на согласование (черновик -> согласование цели) (Отправка уведомления руководителю) 
                tools.create_notification('HC_G_collToBoss_goalSet', card.TopElem.boss_id, "", id);
            } else if (oldStatus == "Согласование руководителя" && newStatus == "Черновик") {
                // Отправка цели на доработку (согласование цели -> черновик) (Отправка уведомления сотруднику)
                tools.create_notification('HC_G_bossToColl_goalEdit', card.TopElem.person_id, "", id);
            } else if (oldStatus == "Согласование руководителя" && newStatus == "Самооценка") {
                // Согласование цели и отправка ее на самооценку (согласование цели -> самооценка) (Отправка уведомления сотруднику)
                tools.create_notification('HC_G_bossToColl_goalAgreed', card.TopElem.person_id, "", id);
            } else if (oldStatus == "Оценка руководителя" && newStatus == "Самооценка") {
                // Отправка оценки цели на доработку оценки (оценка руководителя -> самооценка) (Отправка уведомления сотруднику)
                tools.create_notification('HC_G_bossToColl_goalApprEdit', card.TopElem.person_id, "", id);
            }
        }
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(id)
    }, "json");
}

function get_CloseGoal(queryObjects) {
    var id = queryObjects.HasProperty("id") ? OptInt(queryObjects.id, null) : null;
    var card = tools.open_doc(id);
    card.TopElem.is_close = true;
    card.Save();

    if (ACTIVATE_NOTIFICATION) {
        if (curUserID == card.TopElem.person_id) {
            // Отмена цели сотрудником  (Отправка уведомления руководителю)
            tools.create_notification('HC_G_collToBoss_goalCancel', card.TopElem.boss_id, "", id )
        } else if (curUserID == card.TopElem.boss_id) {
            // Отмена цели руководителем (Отправка уведомления сотруднику)
            tools.create_notification('HC_G_bossToColl_cancelGoal', card.TopElem.person_id, "", id)
        } 
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(id)
    }, "json");
}

// Установка заместителя в целях
function get_SaveDeputy(queryObjects) {
    var goal_id = queryObjects.HasProperty("goal_id") ? OptInt(queryObjects.goal_id, null) : null;
    var deputy_id = queryObjects.HasProperty("deputy_id") ? OptInt(queryObjects.deputy_id, null) : null;
    if ( goal_id != null && deputy_id != null) {
        var card = tools.open_doc(goal_id);
        card.TopElem.deputy_id = deputy_id;
        card.Save();

        if (ACTIVATE_NOTIFICATION) {
            // Установка заместителя (отправка уведомления заместителю)
            tools.create_notification('HC_G_bossToDep_depSet', card.TopElem.deputy_id, "", goal_id);
            // Установка заместителя (отправка уведомления сотруднику)
            tools.create_notification('HC_G_bossToColl_depSet', card.TopElem.person_id, "", goal_id);
        }
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(goal_id)
    }, "json");
}

// Удаление заместителя в целях
function get_DeleteDeputy(queryObjects) {
    var goal_id = queryObjects.HasProperty("goal_id") ? OptInt(queryObjects.goal_id, null) : null;
    if ( goal_id != null ) {
        var card = tools.open_doc(goal_id);
        var deputyID = card.TopElem.deputy_id;
        var deputyFullname = Trim(tools.open_doc(card.TopElem.deputy_id).TopElem.fullname);
        card.TopElem.deputy_id = null;
        card.Save();

        if (ACTIVATE_NOTIFICATION) {
            // Отмена заместителя (отправка уведомления заместителю)
            tools.create_notification('HC_G_bossToDep_depCancel', deputyID, deputyFullname, goal_id);
            // Отмена заместителя (отправка уведомления сотруднику)
            tools.create_notification('HC_G_bossToColl_depCancel', card.TopElem.person_id, deputyFullname, goal_id);
        }
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(goal_id)
    }, "json");
}

// Сотрудник - выставление оценок + перевод на этап "Оценка руководителя"
function post_SaveUserPoint(queryObjects) {
    var data = tools.read_object(queryObjects.Body);
    var goal_id = data.HasProperty("id") ? OptInt(data.id, null) : null;
    var status = data.HasProperty("status") ? Trim(data.status) : "";
    var payload = data.HasProperty("payload") ? data.payload : null;

    if ( goal_id != null ) {
        var card = tools.open_doc(goal_id);
        card.TopElem.status = status;
        card.TopElem.person_evaluation = payload.point;
        card.TopElem.person_comment = payload.comment;
        card.Save();

        if (ACTIVATE_NOTIFICATION) {
            // Оценка цели и отправка ее на оценку руководителя (самооценка -> оценка руководителя) (Отправка уведомления руководителю)
            tools.create_notification('HC_G_collToBoss_goalAppr', card.TopElem.boss_id, "", goal_id);
        }
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(goal_id)
    }, "json");
}

// Руководитель - выставление оценок + перевод на этап "Оценка завершена"
function post_SaveBossPoint(queryObjects) {
    var data = tools.read_object(queryObjects.Body);
    var goal_id = data.HasProperty("id") ? OptInt(data.id, null) : null;
    var status = data.HasProperty("status") ? Trim(data.status) : "";
    var payload = data.HasProperty("payload") ? data.payload : null;

    if ( goal_id != null ) {
        var card = tools.open_doc(goal_id);
        card.TopElem.status = status;
        card.TopElem.boss_evaluation = payload.point;
        card.TopElem.boss_comment = payload.comment;
        card.Save();

        if (ACTIVATE_NOTIFICATION) {
            // Завершение оценки руководителем (оценка руководителем -> оценка завершена) (Отправка уведомления сотруднику)
            tools.create_notification('HC_G_bossToColl_goalApprFinished', card.TopElem.person_id, "", goal_id);
        }
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(goal_id)
    }, "json");
}

function saveCompetence(comp_id, comp_data) {
    var compCard = tools.open_doc(comp_id);
    // Блок ЛИДЕРСКИЕ КОМПЕТЕНЦИИ
    for (el in comp_data.leader.items) {
        try { bossMark = el.boss_mark; } catch(e) { bossMark = "" };
        try { bossComment = el.boss_comment; } catch(e) { bossComment = "" };  
        findComp = ArrayOptFind(compCard.TopElem.competences, 'This.competence_id == ' + Trim(el.id));
        if (findComp != undefined) {
            if ( compCard.TopElem.status == 'self' ) {
                findComp.comment = el.user_comment;
            } else { 
                findComp.mark = bossMark;
                findComp.comment = bossComment;
                finedMarkText = ArrayOptFind(el.scales, 'This.key == ' + XQueryLiteral(bossMark));
                if (finedMarkText != undefined) {
                    findComp.mark_text = finedMarkText.label;
                }
            }
        }
    }
   
    // Блок ВЫВОДЫ И ИТОГИ
    if ( compCard.TopElem.status == 'self' ) {
        compCard.TopElem.custom_elems.ObtainChildByKey('user_comment').value = Trim(comp_data.totals.user_comment);
        compCard.TopElem.custom_elems.ObtainChildByKey('user_func_comment').value = Trim(comp_data.func.user_comment);
    } else {
        var main_point = comp_data.totals.HasProperty("main_point") ? Trim(comp_data.totals.main_point) : "";
        compCard.TopElem.custom_elems.ObtainChildByKey('boss_func_comment').value = Trim(comp_data.func.boss_comment);
        compCard.TopElem.custom_elems.ObtainChildByKey('boss_comment').value = Trim(comp_data.totals.boss_comment);
        compCard.TopElem.custom_elems.ObtainChildByKey('main_point').value = main_point;
    }
    compCard.Save();
}

// Переход на следующий этап в компетенциях
function post_GoToStep(queryObjects) {
    var data = tools.read_object(queryObjects.Body);
    var person_id = data.HasProperty('person_id') ? OptInt(data.person_id, null) : null; 
    var comp_data = data.HasProperty('competences') ? data.competences : null;
    var comp_id = data.HasProperty('comp_id') ? OptInt(data.comp_id, null) : null;
    var save = data.HasProperty('save') ? data.save : false;
    var step = data.HasProperty('step') ? data.step : null;
    
    if (save) {
        try {
            saveCompetence(comp_id, comp_data);
        } catch(e) {
            return tools.object_to_text({
                type: "error",
                message: "Ошибка при сохранении данных " + e,
                data: null
            }, "json");
        }
    }

    //Переставляем этап
    if ( step != null ) {
        var user_id = person_id == null ? curUserID : person_id;
        var findPlan = ArrayOptFirstElem(XQuery("for $elem in assessment_plans where \n\
            $elem/person_id = " + user_id + " \n\
            and $elem/assessment_appraise_id = " + ASSESSMENT_APPRAISE_ID + " \n\
        return $elem"));
        if ( findPlan != undefined && step != null ) {
            planCard = tools.open_doc(findPlan.id);
            curStep = planCard.TopElem.workflow_state;
            bossIDforLetter = getManager(user_id).id;
            if (step == 'firstStep') {
                planCard.TopElem.workflow_state = 'firstStep';
                planCard.TopElem.workflow_state_name = 'Самооценка';
                if (ACTIVATE_NOTIFICATION) {
                    tools.create_notification('HC2_forPersonLetter_again', planCard.TopElem.person_id, "", bossIDforLetter)
                }
              } else if (step == 'secondStep') {
                if (curStep == 'firstStep') {
                    if (ACTIVATE_NOTIFICATION) {
                        tools.create_notification('HC2_forBossLetter', bossIDforLetter, "", planCard.TopElem.person_id)
                    }
                }
                planCard.TopElem.workflow_state = 'secondStep';
                planCard.TopElem.workflow_state_name = 'Cогласование руководителем';
                // Отправляем уведомление только если текущий этап 1, дабы не спамить руководителя при откате на свой этап с 3.
              } else {
                planCard.TopElem.workflow_state = 'thirdStep';
                planCard.TopElem.workflow_state_name = 'Оценка завершена';
                if (ACTIVATE_NOTIFICATION) {
                    tools.create_notification('HC2_forPersonLetter', planCard.TopElem.person_id, "", bossIDforLetter);
                }
              }
            planCard.Save();
        }
        if ( data.HasProperty('person_id') ) {
            return get_Competence({person_id: person_id });      
        }
        return get_Competence({});
    }
}

%>