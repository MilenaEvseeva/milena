<%
SERVER_TEMPLATE = OpenDoc(UrlFromDocID(7026428212512183564));
SHOW_RESULT_USER = tools_web.is_true(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'SHOW_RESULT_USER'").value);
ASSESSMENT_APPRAISE_ID = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'ASSESSMENT_APPRAISE_ID'").value, null);
GROUP_FOR_ASSESSMENT = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'GROUP_FOR_ASSESSMENT'").value, null);
MAIN_BOSS_TYPE_ID = OptInt(ArrayOptFind(SERVER_TEMPLATE.TopElem.wvars, "This.name == 'MAIN_BOSS_TYPE_ID'").value, null);


NO_AVATAR_ID = 6973931295549759668;
IMG_BASE_URL = "";
YEAR = 2021;

try {
    curUserID == true 
} catch (e) {
    IMG_BASE_URL = "https://agent-learn.vsk.ru";
    //var curUserID = 6992666023990938310; // Я
    //var curUserID = 6992666656314124604; // Лариса
    var curUserID = 6992659464736094202; // Титлинова
    var curUser = tools.open_doc(curUserID).TopElem;
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
            and col.is_dismiss != 1 \n\
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
            and cols.is_dismiss <> 1 \n\
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
            and cols.is_dismiss <> 1 \n\
    ")) == undefined ? false : true;    
    var isDeputy = ArrayOptFirstElem(XQuery("for $elem in cc_hc_totals where \n\
        $elem/deputy_id = "+curUserID+" return $elem \n\
    ")) == undefined ? false : true;

    if ( findCompetenceUsers || findGoalsUsers || isDeputy) {
        return true;
    }
    return false;
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

function getAccess(person_id, boss_id, deputy_id, is_locked, step) {
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
        canViewBossResult: false
    }
    // Установка заместителя
    if (is_locked) {
        return result;
    }

    if (boss || SHOW_RESULT_USER) {
        result.canViewBossResult = true;
    }

    if ( boss_id == curUserID && deputy_id == null && step != "Оценка завершена" ) {
        result.canSetDeputy = true;
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
        result.canClose = true;
    } else if ( step == "Самооценка" && boss ) {
        result.canClose = true;
    } else if ( step == "Оценка руководителя" && boss ) {
        result.canBossEvaluation = true;
        result.canClose = true;
    }
    return result;
}

function getGoal(id) {
    var card = tools.open_doc(id);
    var cardTE = card.TopElem;

    try { start_date = StrMimeDate(cardTE.start_date) } catch(e) { start_date = "" };
    try { finish_date = StrMimeDate(cardTE.finish_date) } catch(e) { finish_date = "" };
    try { min = Real(cardTE.min) } catch(e) { min = null };
    try { max = Real(cardTE.max) } catch(e) { max = null };
    try { target = Real(cardTE.target) } catch(e) { target = null };

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
        is_close: tools_web.is_true(cardTE.global_locked),
        target: target,
        person_evaluation: Trim(cardTE.person_evaluation),
        person_comment: Trim(cardTE.person_comment),
        boss_comment: Trim(cardTE.boss_comment),
        boss_evaluation: Trim(cardTE.boss_evaluation),
        status: Trim(cardTE.status),
        access: getAccess(cardTE.person_id, cardTE.boss_id, cardTE.deputy_id, cardTE.global_locked, cardTE.status)
    }
    return result;
}

function getGoals(user_id) {
    var result = [];
    var findTotals = XQuery("sql: \n\
        declare @user_id bigint = "+user_id+"; \n\
        declare @boss_id bigint = "+curUserID+"; \n\
        SELECT \n\
            at.* \n\
        FROM \n\
            cc_hc_totals as at \n\
        WHERE \n\
            at.person_id = @user_id \n\
            and (at.boss_id = @boss_id or at.deputy_id = @boss_id) \n\
            and at.year = '2021' \n\
    ");

    for (el in findTotals) {
        try { start_date = StrMimeDate(el.start_date) } catch(e) { start_date = "" };
        try { finish_date = StrMimeDate(el.finish_date) } catch(e) { finish_date = "" };
        try { min = Real(el.min) } catch(e) { min = null };
        try { max = Real(el.max) } catch(e) { max = null };
        try { target = Real(el.target) } catch(e) { target = null };
        
        result.push({
            id: Trim(el.id),
            description: Trim(el.description),
            title: Trim(el.title),
            priority: Trim(el.priority),
            start_date: start_date,
            finish_date: finish_date,
            is_close: tools_web.is_true(el.global_locked),
            deputy: getDeputy(el.deputy_id),
            min: min,
            max: max,
            target: target,
            person_evaluation: Trim(el.person_evaluation),
            person_comment: Trim(el.person_comment),
            boss_comment: Trim(el.boss_comment),
            boss_evaluation: Trim(el.boss_evaluation),
            status: Trim(el.status),
            access: getAccess(el.person_id, el.boss_id, el.deputy_id, el.global_locked, el.status)
        })
    }
    return result;
}

function getCurUserGoals(user_id) {
    var result = [];
    var findTotals = XQuery("sql: \n\
        declare @user_id bigint = "+user_id+"; \n\
        SELECT \n\
            at.* \n\
        FROM \n\
            cc_hc_totals as at \n\
        WHERE \n\
            at.person_id = @user_id \n\
            and at.year = '2021' \n\
    ");

    for (el in findTotals) {
        try { start_date = StrMimeDate(el.start_date) } catch(e) { start_date = "" };
        try { finish_date = StrMimeDate(el.finish_date) } catch(e) { finish_date = "" };
        try { min = Real(el.min) } catch(e) { min = null };
        try { max = Real(el.max) } catch(e) { max = null };
        try { target = Real(el.target) } catch(e) { target = null };
        
        result.push({
            id: Trim(el.id),
            description: Trim(el.description),
            title: Trim(el.title),
            priority: Trim(el.priority),
            start_date: start_date,
            finish_date: finish_date,
            is_close: tools_web.is_true(el.global_locked),
            deputy: getDeputy(el.deputy_id),
            min: min,
            max: max,
            person_evaluation: Trim(el.person_evaluation),
            person_comment: Trim(el.person_comment),
            boss_comment: Trim(el.boss_comment),
            boss_evaluation: Trim(el.boss_evaluation),
            target: target,
            status: Trim(el.status),
            access: getAccess(el.person_id, el.boss_id, el.deputy_id, el.global_locked, el.status)
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

function get_BaseData() {
    var category = curUser.custom_elems.GetOptChildByKey('f_ng1k') == undefined ? "" : curUser.custom_elems.GetOptChildByKey('f_ng1k').value;
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
            avatar: getAvatar(curUser),
            goals: getCurUserGoals(curUserID)
        },
        navigation: {
            isCurUserInCompetence: isCurUserInCompetence(),
            isCurUserInAssessment: isCurUserInAssessment(), // проверить что состоит в группе
            isCurUserBoss: isCurUserBoss(), // проверить что есть подчинненный который остоит в группе
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
        avatar: getAvatar(userCard),
        goals: getGoals(user_id)
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: result
    }, "json");
}

function post_SaveGoal(queryObjects) {
    var data = tools.read_object(queryObjects.Body);
    var id = data.HasProperty("id") ? OptInt(data.id, null) : null;
    var title = data.HasProperty("title") ? Trim(data.title) : "";
    var description = data.HasProperty("description") ? Trim(data.description) : "";
    var priority = data.HasProperty("priority") ? Trim(data.priority) : "Низкий";
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
    var min = data.HasProperty("min") ? Trim(data.min) : "";
    var max = data.HasProperty("max") ? Trim(data.max) : "";
    var target = data.HasProperty("target") ? Trim(data.target) : "";

    if (id == null ) {
        newDoc = tools.new_doc_by_name('cc_hc_total');
        newDoc.TopElem.status = "Черновик";
        newDoc.BindToDb(DefaultDb);                
    } else {
        newDoc = tools.open_doc(id);
    }
    newDoc.TopElem.title = title;
    newDoc.TopElem.description = description;
    newDoc.TopElem.priority = priority;
    newDoc.TopElem.person_id = curUserID;
    newDoc.TopElem.start_date = start_date;
    newDoc.TopElem.finish_date = finish_date;
    newDoc.TopElem.boss_id = getManager(curUserID).id;
    newDoc.TopElem.year = YEAR;
    newDoc.TopElem.min = min;
    newDoc.TopElem.max = max;
    newDoc.TopElem.target = target;
    newDoc.Save();

    return tools.object_to_text({
        type: "success",
        message: "",
        data: getCurUserGoals(curUserID)
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

function get_Team() {
    var result = [];
    var IMG_URL = IMG_BASE_URL + '/download_file.html?file_id=' + NO_AVATAR_ID;
    var findTeams = XQuery("sql: \n\
        declare @boss_id bigint = "+curUserID+"; \n\
        declare @group_id bigint = "+GROUP_FOR_ASSESSMENT+"; \n\
        declare @boss_type_id bigint = "+MAIN_BOSS_TYPE_ID+"; \n\
        declare @no_avatar varchar(max) = '"+IMG_URL+"'; \n\
        declare @assessment_appraise_id bigint = "+ASSESSMENT_APPRAISE_ID+"; \n\
        SELECT \n\
        * \n\
        FROM ( \n\
            SELECT \n\
                col_xml.id, \n\
                cmp.value('firstname[1]', 'varchar(max)') as firstname, \n\
                cmp.value('lastname[1]', 'varchar(max)') as lastname, \n\
                cmp.value('middlename[1]', 'varchar(max)') as middlename, \n\
                cmp.value('position_name[1]', 'varchar(max)') as position_name, \n\
                isNULL(cmp.value('pict_url[1]', 'varchar(max)'), @no_avatar) as avatar, \n\
                (SELECT COUNT(*) from cc_hc_totals as cc where cc.person_id = col_xml.id ) as goals_count, \n\
                ( \n\
                    SELECT \n\
                        case COUNT(pas.id) \n\
                            when 0 then 0 \n\
                            else 1 \n\
                        end result \n\
                    FROM \n\
                        pas \n\
                    WHERE \n\
                    pas.person_id = col_xml.id \n\
                    and pas.assessment_appraise_id = @assessment_appraise_id \n\
                    and.pas.assessment_appraise_type = 'competence_appraisal' \n\
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
                        gc.collaborator_id = col_xml.id \n\
                        and gc.group_id = @group_id \n\
                ) as show_total \n\
                FROM \n\
                    func_managers as fm \n\
                    inner join collaborator as col_xml on col_xml.id = fm.object_id \n\
                    CROSS APPLY col_xml.data.nodes('collaborator') as R(cmp) \n\
            WHERE \n\
                fm.person_id = @boss_id \n\
                and fm.boss_type_id = @boss_type_id \n\
                and cmp.value('is_dismiss[1]', 'varchar(max)') <> 1 \n\
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
        SELECT \n\
            col_xml.id, \n\
            cmp.value('firstname[1]', 'varchar(max)') as firstname, \n\
            cmp.value('lastname[1]', 'varchar(max)') as lastname, \n\
            cmp.value('middlename[1]', 'varchar(max)') as middlename, \n\
            cmp.value('position_name[1]', 'varchar(max)') as position_name, \n\
            isNULL(cmp.value('pict_url[1]', 'varchar(max)'), @no_avatar) as avatar, \n\
            (SELECT COUNT(*) from cc_hc_totals as cc where cc.person_id = col_xml.id and cc.deputy_id = @boss_id ) as goals_count, \n\
            ( \n\
                SELECT \n\
                    case COUNT(pas.id) \n\
                        when 0 then 0 \n\
                        else 1 \n\
                    end result \n\
                FROM \n\
                    pas \n\
                WHERE \n\
                pas.person_id = col_xml.id \n\
                and pas.assessment_appraise_id = @assessment_appraise_id \n\
                and.pas.assessment_appraise_type = 'competence_appraisal' \n\
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
                    gc.collaborator_id = col_xml.id \n\
                    and gc.group_id = @group_id \n\
                    and (SELECT COUNT(cc.person_id) FROM cc_hc_totals cc WHERE cc.deputy_id = @boss_id) > 0 \n\
            ) as show_total \n\
        FROM \n\
        ( \n\
            SELECT dh.person_id FROM cc_deputy_heads dh WHERE dh.deputy_id = @boss_id \n\
            UNION \n\
            SELECT cc.person_id FROM cc_hc_totals cc WHERE	cc.deputy_id = @boss_id \n\
        ) as ss \n\
            INNER JOIN collaborator as col_xml on col_xml.id = ss.person_id \n\
            CROSS APPLY col_xml.data.nodes('collaborator') as R(cmp) \n\
        WHERE \n\
            cmp.value('is_dismiss[1]', 'varchar(max)') <> 1 \n\
    ");

    for (el in findTeams) {
        result.push({
            id: Trim(el.id),
            lastname: Trim(el.lastname),
            firstname: Trim(el.firstname),
            middlename: Trim(el.middlename),
            position_name: Trim(el.position_name),
            avatar: Trim(el.avatar),
            goals_count: Trim(el.goals_count),
            showTotal: tools_web.is_true(el.show_total),
            showCompetence: tools_web.is_true(el.show_competence),
            is_deputy: false
        })
    }

    for (el in findDeputyTeams) {
        result.push({
            id: Trim(el.id),
            lastname: Trim(el.lastname),
            firstname: Trim(el.firstname),
            middlename: Trim(el.middlename),
            position_name: Trim(el.position_name),
            avatar: Trim(el.avatar),
            goals_count: Trim(el.goals_count),
            showTotal: tools_web.is_true(el.show_total),
            showCompetence: tools_web.is_true(el.show_competence),
            is_deputy: true
        })
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: result
    }, "json");
}

function get_SetStatus(queryObjects) {
    var id = queryObjects.HasProperty("id") ? OptInt(queryObjects.id, null) : null;
    var status = queryObjects.HasProperty("status") ? Trim(queryObjects.status) : "";
    if ( status != "" && id != null ) {
        var card = tools.open_doc(id);
        card.TopElem.status = status;
        card.Save();
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
    card.TopElem.global_locked = true;
    card.Save();

    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(id)
    }, "json");
}

function get_SaveDeputy(queryObjects) {
    var goal_id = queryObjects.HasProperty("goal_id") ? OptInt(queryObjects.goal_id, null) : null;
    var deputy_id = queryObjects.HasProperty("deputy_id") ? OptInt(queryObjects.deputy_id, null) : null;
    if ( goal_id != null && deputy_id != null) {
        var card = tools.open_doc(goal_id);
        card.TopElem.deputy_id = deputy_id;
        card.Save();
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(goal_id)
    }, "json");
}

function get_DeleteDeputy(queryObjects) {
    var goal_id = queryObjects.HasProperty("goal_id") ? OptInt(queryObjects.goal_id, null) : null;
    if ( goal_id != null ) {
        var card = tools.open_doc(goal_id);
        card.TopElem.deputy_id = null;
        card.Save();
    }
    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(goal_id)
    }, "json");
}

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
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(goal_id)
    }, "json");
}

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
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: getGoal(goal_id)
    }, "json");
}

%>